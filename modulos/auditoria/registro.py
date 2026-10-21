from contextvars import ContextVar
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import event, inspect
from sqlalchemy.orm import Session

from modulos.auditoria.tabla import EventoAuditoria
from modulos.auditoria.repository import AuditoriaRepository as repo
from modulos.auditoria.service import AuditoriaService
from utils.token import verificar_token


usuario_actual: ContextVar[dict | None] = ContextVar("usuario_auditoria", default=None)

CAMPOS_AUDITABLES = {
    "aulas": {"codigo", "edificio", "capacidad", "activo"},
    "asignaturas": {"codigo", "nombre", "unidades_valorativas", "carrera_id", "requisito_id", "activo"},
    "calificaciones": {"matricula_id", "primer_parcial", "segundo_parcial", "tercer_parcial", "nota_final", "observacion"},
    "carreras": {"codigo", "nombre", "duracion_anios", "activo"},
    "docentes": {"especialidad", "cargo", "departamento", "tipo_contrato", "fecha_ingreso", "estado"},
    "estudiantes": {"carrera_id", "estado"},
    "matriculas": {"estudiante_id", "seccion_id", "fecha_matricula", "estado"},
    "periodos": {"anio", "numero", "fecha_inicio", "fecha_fin", "activo"},
    "secciones": {"codigo", "asignatura_id", "docente_id", "periodo_id", "aula_id", "dias", "hora_inicio", "hora_fin", "cupo_maximo", "estado"},
    "solicitudes_cuenta": {"estado", "revisado_por"},
    "usuarios": {"rol", "activo", "docente_id"},
    "obligaciones_financieras": {"tipo", "estudiante_id", "docente_id", "mes", "concepto", "monto", "moneda", "vence_en"},
    "pagos_financieros": {"obligacion_id", "referencia", "monto", "fecha", "metodo"},
}


def _dato_serializable(valor):
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    if isinstance(valor, Decimal):
        return str(valor)
    return valor


def _detalle_cambios(objeto, accion: str):
    permitidos = CAMPOS_AUDITABLES.get(objeto.__tablename__, set())
    anteriores = {}
    nuevos = {}
    estado = inspect(objeto)
    for nombre in permitidos:
        historial = estado.attrs[nombre].history
        if accion == "EDITAR" and not historial.has_changes():
            continue
        if accion != "CREAR" and historial.deleted:
            anteriores[nombre] = _dato_serializable(historial.deleted[0])
        if accion != "ELIMINAR" and historial.added:
            nuevos[nombre] = _dato_serializable(historial.added[0])
    return anteriores or None, nuevos or None


def identificar_usuario(
    authorization: str | None, session_cookie: str | None = None
) -> dict | None:
    token = session_cookie
    if authorization:
        esquema, _, token_autorizacion = authorization.partition(" ")
        if esquema.lower() != "bearer" or not token_autorizacion:
            return None
        token = token_autorizacion
    if not token:
        return None

    try:
        return verificar_token(token)
    except Exception:
        return None


def registrar_evento(db: Session, accion: str, modulo: str, descripcion: str, registro_id: int | None = None):
    AuditoriaService.registrar_evento(
        db, usuario_actual.get(), accion, modulo, descripcion, registro_id
    )


@event.listens_for(Session, "after_flush")
def registrar_cambios(db: Session, flush_context):
    usuario = usuario_actual.get()
    if usuario is None:
        return

    eventos = []
    for accion, objetos in (("CREAR", db.new), ("EDITAR", db.dirty), ("ELIMINAR", db.deleted)):
        for objeto in objetos:
            if isinstance(objeto, EventoAuditoria) or not hasattr(objeto, "__tablename__"):
                continue
            if accion == "EDITAR" and not db.is_modified(objeto, include_collections=False):
                continue

            modulo = objeto.__tablename__
            registro_id = inspect(objeto).identity[0] if inspect(objeto).identity else getattr(objeto, "id", None)
            anteriores, nuevos = _detalle_cambios(objeto, accion)
            eventos.append({
                "institucion_id": usuario.get(
                    "institucion_id", db.info.get("institucion_id")
                ) or 1,
                "usuario_id": usuario.get("user_id"),
                "usuario": usuario.get("user", "Desconocido"),
                "accion": accion,
                "modulo": modulo,
                "registro_id": registro_id,
                "descripcion": f"{accion.capitalize()} registro en {modulo}",
                "ip_origen": usuario.get("ip_origen"),
                "datos_anteriores": anteriores,
                "datos_nuevos": nuevos,
            })

    if eventos:
        repo.insertar_eventos_en_transaccion(db, eventos)
