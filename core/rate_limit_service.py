import hashlib
import hmac
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from core.config import settings
from core.excepciones import IntentosVerificacionLimitadosError
from core.rate_limit_repository import RateLimitRepository


def limitar_peticion_por_ip(
    db: Session,
    categoria: str,
    ip: str,
    cantidad_permitida: int,
    ventana_segundos: int,
) -> None:
    ahora = datetime.now(timezone.utc)
    secreto = settings.SECRET_KEY.get_secret_value().encode("utf-8")
    dato = f"peticion:{categoria}:{ip}".encode("utf-8")
    clave = hmac.new(secreto, dato, hashlib.sha256).hexdigest()

    segundos_bloqueado = RateLimitRepository.buscar_bloqueo(db, [clave], ahora)
    if segundos_bloqueado:
        raise IntentosVerificacionLimitadosError(segundos_bloqueado)

    segundos_bloqueado = RateLimitRepository.registrar_intento(
        db,
        [(clave, cantidad_permitida)],
        ahora,
        ventana_segundos,
        ventana_segundos,
        ventana_segundos,
    )
    if segundos_bloqueado:
        raise IntentosVerificacionLimitadosError(segundos_bloqueado)
