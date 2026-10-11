import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from core.config import settings
from core.excepciones import (
    IntentosVerificacionLimitadosError,
    RecursoDuplicadoError,
    RecursoNoEncontradoError,
    ServicioCorreoNoDisponibleError,
    VerificacionCorreoInvalidaError,
)
from modulos.docentes.tabla import Docentes
from modulos.login.tabla import Usuarios
from modulos.solicitudes_cuenta import repository as repo
from modulos.solicitudes_cuenta.schema import (
    AprobarSolicitudCuenta,
    SolicitudCuentaCrear,
)
from modulos.solicitudes_cuenta.tabla import (
    SolicitudesCuenta,
    VerificacionesCorreoSolicitud,
)
from utils.correo import enviar_correo
from utils.hash import encriptar_contrasena


def _ahora_sin_zona() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_secreto(valor: str) -> str:
    return hashlib.sha256(valor.encode("utf-8")).hexdigest()


def _hash_codigo(verificacion_id: str, codigo: str) -> str:
    mensaje = f"{verificacion_id}:{codigo}".encode("utf-8")
    return hmac.new(settings.SECRET_KEY.encode("utf-8"), mensaje, hashlib.sha256).hexdigest()


def _hash_ip(ip: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        ip.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _verificar_hash(esperado: str, recibido: str) -> bool:
    return hmac.compare_digest(esperado, recibido)


def solicitar_codigo_correo(db: Session, correo: str, ip: str) -> dict[str, str]:
    if not all((settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD, settings.SMTP_FROM)):
        raise ServicioCorreoNoDisponibleError("El envio de correo no esta configurado.")

    correo_normalizado = str(correo).strip().casefold()
    ahora = _ahora_sin_zona()
    ip_hash = _hash_ip(ip)
    ultima = repo.ultima_verificacion_correo(db, correo_normalizado)
    if ultima and ultima.reintentar_desde > ahora:
        raise IntentosVerificacionLimitadosError(
            max(1, int((ultima.reintentar_desde - ahora).total_seconds()))
        )

    desde = ahora - timedelta(minutes=15)
    if repo.contar_codigos_correo_desde(db, correo_normalizado, desde) >= 3:
        raise IntentosVerificacionLimitadosError(15 * 60)
    if repo.contar_codigos_ip_desde(db, ip_hash, desde) >= 20:
        raise IntentosVerificacionLimitadosError(15 * 60)

    verificacion_id = str(uuid.uuid4())
    codigo = f"{secrets.randbelow(1_000_000):06d}"
    verificacion = VerificacionesCorreoSolicitud(
        id=verificacion_id,
        correo=correo_normalizado,
        ip_hash=ip_hash,
        codigo_hash=_hash_codigo(verificacion_id, codigo),
        expira_en=ahora + timedelta(minutes=settings.SIGNUP_EMAIL_CODE_TTL_MINUTES),
        reintentar_desde=ahora + timedelta(seconds=settings.SIGNUP_EMAIL_CODE_RESEND_SECONDS),
        intentos=0,
        created_at=ahora,
    )
    repo.guardar_verificacion(db, verificacion)

    try:
        enviar_correo(
            correo_normalizado,
            "Verifica tu correo para CampusFlow",
            (
                f"Tu codigo de verificacion es: {codigo}\n\n"
                f"El codigo vence en {settings.SIGNUP_EMAIL_CODE_TTL_MINUTES} minutos. "
                "Si no iniciaste esta solicitud, puedes ignorar este mensaje."
            ),
        )
    except Exception as error:
        repo.invalidar_verificacion(db, verificacion, _ahora_sin_zona())
        raise ServicioCorreoNoDisponibleError(
            "No se pudo enviar el codigo. Revisa la configuracion de correo e intenta de nuevo."
        ) from error

    return {
        "verificacion_id": verificacion_id,
        "expires_in_seconds": settings.SIGNUP_EMAIL_CODE_TTL_MINUTES * 60,
        "resend_after_seconds": settings.SIGNUP_EMAIL_CODE_RESEND_SECONDS,
        "detail": "Si el correo es valido, recibiras un codigo de verificacion.",
    }


def confirmar_codigo_correo(
    db: Session,
    verificacion_id: str,
    codigo: str,
    ip: str,
) -> dict[str, str]:
    ahora = _ahora_sin_zona()
    verificacion = repo.obtener_verificacion(db, verificacion_id, bloquear=True)
    if (
        verificacion is None
        or verificacion.consumido_en is not None
        or verificacion.expira_en <= ahora
        or verificacion.ticket_hash is not None
    ):
        raise VerificacionCorreoInvalidaError("El codigo es invalido o vencio. Solicita uno nuevo.")

    if not _verificar_hash(verificacion.ip_hash, _hash_ip(ip)):
        raise VerificacionCorreoInvalidaError("El codigo es invalido o vencio. Solicita uno nuevo.")

    hash_recibido = _hash_codigo(verificacion_id, codigo)
    if not _verificar_hash(verificacion.codigo_hash, hash_recibido):
        verificacion.intentos += 1
        if verificacion.intentos >= settings.SIGNUP_EMAIL_CODE_MAX_ATTEMPTS:
            repo.invalidar_verificacion(db, verificacion, ahora)
            raise IntentosVerificacionLimitadosError(settings.SIGNUP_EMAIL_CODE_RESEND_SECONDS)
        repo.guardar_intento_verificacion(db, verificacion)
        raise VerificacionCorreoInvalidaError("El codigo es incorrecto.")

    ticket = secrets.token_urlsafe(32)
    verificacion.ticket_hash = _hash_secreto(ticket)
    verificacion.ticket_expira_en = ahora + timedelta(minutes=10)
    verificacion.codigo_hash = ""
    repo.guardar_intento_verificacion(db, verificacion)
    return {"ticket_verificacion": ticket, "detail": "Correo verificado."}


def crear_solicitud(db: Session, datos: SolicitudCuentaCrear) -> None:
    correo = str(datos.correo).strip().casefold()
    usuario = datos.usuario.strip()
    ticket_hash = _hash_secreto(datos.ticket_verificacion)
    ahora = _ahora_sin_zona()
    verificacion = repo.obtener_ticket_verificado(db, ticket_hash)
    if (
        verificacion is None
        or verificacion.correo != correo
        or verificacion.consumido_en is not None
        or verificacion.ticket_expira_en is None
        or verificacion.ticket_expira_en <= ahora
    ):
        raise VerificacionCorreoInvalidaError("Verifica tu correo antes de enviar la solicitud.")

    if repo.existe_cuenta_o_solicitud(db, correo, usuario):
        raise RecursoDuplicadoError("Ya existe una cuenta o solicitud pendiente con esos datos.")

    solicitud = SolicitudesCuenta(
        nombre_completo=datos.nombre_completo.strip(),
        correo=correo,
        usuario=usuario,
        contrasena_hash=encriptar_contrasena(datos.contrasena),
    )
    repo.guardar_solicitud_y_consumir_ticket(db, solicitud, verificacion, ahora)


def listar_solicitudes(db: Session) -> list[SolicitudesCuenta]:
    return repo.listar_solicitudes(db)


def aprobar_solicitud(
    db: Session,
    solicitud_id: int,
    datos: AprobarSolicitudCuenta,
    administrador_id: int,
) -> SolicitudesCuenta:
    solicitud = repo.obtener_solicitud(db, solicitud_id, bloquear=True)
    if solicitud is None:
        raise RecursoNoEncontradoError("No se encontro la solicitud.")
    if solicitud.estado != "PENDIENTE":
        raise RecursoDuplicadoError("La solicitud ya fue revisada.")
    if repo.existe_usuario_con_correo_o_nombre(db, solicitud.correo, solicitud.usuario):
        raise RecursoDuplicadoError("Ya existe una cuenta con esos datos.")

    docente_id = datos.docente_id
    if datos.docente_nuevo is not None:
        numero = datos.docente_nuevo.numero_empleado.strip()
        if repo.existe_docente_con_correo_o_numero(db, solicitud.correo, numero):
            raise RecursoDuplicadoError(
                "Ya existe un docente con ese correo o numero de empleado."
            )

        docente = Docentes(
            numero_empleado=numero,
            nombres=datos.docente_nuevo.nombres.strip(),
            apellidos=datos.docente_nuevo.apellidos.strip(),
            correo=solicitud.correo,
            especialidad="",
            estado=True,
        )
        docente_id = repo.crear_docente(db, docente)

    if docente_id is not None and not repo.existe_docente(db, docente_id):
        raise RecursoNoEncontradoError("No se encontro el docente indicado.")
    if docente_id is not None and repo.existe_usuario_vinculado_docente(db, docente_id):
        raise RecursoDuplicadoError("Ese docente ya tiene una cuenta vinculada.")

    usuario = Usuarios(
        usuario=solicitud.usuario,
        nombre=solicitud.nombre_completo,
        correo=solicitud.correo,
        contrasena=solicitud.contrasena_hash,
        rol=datos.rol,
        docente_id=docente_id,
        activo=True,
    )
    solicitud.estado = "APROBADA"
    solicitud.contrasena_hash = ""
    solicitud.revisado_por = administrador_id
    solicitud.revisado_en = _ahora_sin_zona()
    return repo.guardar_revision(db, solicitud, usuario)


def rechazar_solicitud(
    db: Session,
    solicitud_id: int,
    administrador_id: int,
) -> SolicitudesCuenta:
    solicitud = repo.obtener_solicitud(db, solicitud_id, bloquear=True)
    if solicitud is None:
        raise RecursoNoEncontradoError("No se encontro la solicitud.")
    if solicitud.estado != "PENDIENTE":
        raise RecursoDuplicadoError("La solicitud ya fue revisada.")

    solicitud.estado = "RECHAZADA"
    solicitud.revisado_por = administrador_id
    solicitud.revisado_en = _ahora_sin_zona()
    solicitud.contrasena_hash = ""
    return repo.guardar_rechazo(db, solicitud)
