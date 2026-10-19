import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from sqlalchemy.orm import Session

from core.config import settings
from core.excepciones import CredencialesInvalidasError
from modulos.login.recuperacion_repository import RecuperacionRepository as repo
from utils.correo import enviar_correo
from utils.hash import encriptar_contrasena


def _ahora_sin_zona() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def solicitar_recuperacion(db: Session, correo: str) -> None:
    if not all((settings.SMTP_HOST, settings.SMTP_USER, settings.smtp_password, settings.SMTP_FROM)):
        raise RuntimeError("El envio de correo no esta configurado.")

    usuario = repo.buscar_usuario_activo_por_correo(db, correo)
    if usuario is None:
        return

    ahora = _ahora_sin_zona()
    solicitudes_recientes = repo.contar_solicitudes_desde(db, usuario.id, ahora - timedelta(minutes=15))
    if solicitudes_recientes >= 3:
        return

    token = secrets.token_urlsafe(32)
    repo.crear_solicitud(db, usuario.id, _hash_token(token), ahora, ahora + timedelta(minutes=30))

    origen = settings.FRONTEND_ORIGINS.split(",")[0].strip().rstrip("/")
    enlace = f"{origen}/restablecer-contrasena?token={quote(token)}"
    try:
        # El enlace usa un token de un solo uso; la base conserva solo su hash.
        enviar_correo(
            usuario.correo,
            "Recuperacion de acceso a CampusFlow",
            f"Abre este enlace dentro de los proximos 30 minutos para cambiar tu contrasena:\n\n{enlace}\n\nSi no solicitaste el cambio, ignora este mensaje.",
        )
    except Exception:
        repo.invalidar_solicitud(db, _hash_token(token), _ahora_sin_zona())
        raise


def confirmar_recuperacion(db: Session, token: str, contrasena: str) -> None:
    ahora = _ahora_sin_zona()
    solicitud = repo.buscar_solicitud_vigente(db, _hash_token(token), ahora)
    if solicitud is None:
        raise CredencialesInvalidasError("El enlace es invalido o ya vencio.")

    usuario = repo.buscar_usuario_activo(db, solicitud.usuario_id)
    if usuario is None:
        raise CredencialesInvalidasError("El enlace es invalido o ya vencio.")

    repo.guardar_nueva_contrasena(db, usuario, solicitud, encriptar_contrasena(contrasena), ahora)
