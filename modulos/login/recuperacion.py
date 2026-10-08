import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.config import settings
from core.excepciones import CredencialesInvalidasError
from modulos.login.tabla import Usuarios
from modulos.solicitudes_cuenta.tabla import SolicitudesRecuperacion
from utils.correo import enviar_correo
from utils.hash import encriptar_contrasena


def _ahora_sin_zona() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def solicitar_recuperacion(db: Session, correo: str) -> None:
    if not all((settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD, settings.SMTP_FROM)):
        raise RuntimeError("El envio de correo no esta configurado.")

    usuario = db.query(Usuarios).filter(
        func.lower(Usuarios.correo) == correo.casefold(),
        Usuarios.activo.is_(True),
    ).first()
    if usuario is None:
        return

    ahora = _ahora_sin_zona()
    solicitudes_recientes = db.query(SolicitudesRecuperacion).filter(
        SolicitudesRecuperacion.usuario_id == usuario.id,
        SolicitudesRecuperacion.created_at >= ahora - timedelta(minutes=15),
    ).count()
    if solicitudes_recientes >= 3:
        return

    db.query(SolicitudesRecuperacion).filter(
        SolicitudesRecuperacion.usuario_id == usuario.id,
        SolicitudesRecuperacion.usado_en.is_(None),
    ).update({SolicitudesRecuperacion.usado_en: ahora})

    token = secrets.token_urlsafe(32)
    db.add(SolicitudesRecuperacion(
        usuario_id=usuario.id,
        token_hash=_hash_token(token),
        expira_en=ahora + timedelta(minutes=30),
    ))
    db.commit()

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
        db.query(SolicitudesRecuperacion).filter(
            SolicitudesRecuperacion.token_hash == _hash_token(token),
        ).update({SolicitudesRecuperacion.usado_en: _ahora_sin_zona()})
        db.commit()
        raise


def confirmar_recuperacion(db: Session, token: str, contrasena: str) -> None:
    ahora = _ahora_sin_zona()
    solicitud = db.query(SolicitudesRecuperacion).filter(
        SolicitudesRecuperacion.token_hash == _hash_token(token),
        SolicitudesRecuperacion.usado_en.is_(None),
        SolicitudesRecuperacion.expira_en > ahora,
    ).first()
    if solicitud is None:
        raise CredencialesInvalidasError("El enlace es invalido o ya vencio.")

    usuario = db.query(Usuarios).filter(
        Usuarios.id == solicitud.usuario_id,
        Usuarios.activo.is_(True),
    ).first()
    if usuario is None:
        raise CredencialesInvalidasError("El enlace es invalido o ya vencio.")

    usuario.contrasena = encriptar_contrasena(contrasena)
    usuario.version_token += 1
    solicitud.usado_en = ahora
    db.query(SolicitudesRecuperacion).filter(
        SolicitudesRecuperacion.usuario_id == usuario.id,
        SolicitudesRecuperacion.usado_en.is_(None),
    ).update({SolicitudesRecuperacion.usado_en: ahora})
    db.commit()
