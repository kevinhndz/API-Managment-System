from contextvars import ContextVar

from sqlalchemy import event, inspect
from sqlalchemy.orm import Session

from modulos.auditoria.tabla import EventoAuditoria
from utils.token import verificar_token


usuario_actual: ContextVar[dict | None] = ContextVar("usuario_auditoria", default=None)


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
    usuario = usuario_actual.get()
    if usuario is None:
        return

    db.add(EventoAuditoria(
        usuario_id=usuario.get("user_id"),
        usuario=usuario.get("user", "Desconocido"),
        accion=accion,
        modulo=modulo,
        registro_id=registro_id,
        descripcion=descripcion,
    ))
    db.commit()


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
            eventos.append({
                "usuario_id": usuario.get("user_id"),
                "usuario": usuario.get("user", "Desconocido"),
                "accion": accion,
                "modulo": modulo,
                "registro_id": registro_id,
                "descripcion": f"{accion.capitalize()} registro en {modulo}",
            })

    if eventos:
        db.connection().execute(EventoAuditoria.__table__.insert(), eventos)
