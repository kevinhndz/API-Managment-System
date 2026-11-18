from datetime import datetime, timezone

from sqlalchemy.orm import Session

from core.excepciones import AccesoProhibidoError
from modulos.suscripciones.repository import obtener_por_institucion
from modulos.suscripciones.tabla import Suscripciones


def obtener_suscripcion(db: Session) -> Suscripciones | None:
    institucion_id = db.info.get("institucion_id")
    if institucion_id is None:
        raise AccesoProhibidoError("No se encontro el contexto de institucion")
    return obtener_por_institucion(db, institucion_id)


def esta_vigente(suscripcion: Suscripciones | None) -> bool:
    if suscripcion is None or suscripcion.estado not in {"PRUEBA", "ACTIVA"}:
        return False
    ahora = datetime.now(timezone.utc)
    inicio = suscripcion.inicia_en
    vencimiento = suscripcion.vence_en
    if inicio.tzinfo is None:
        inicio = inicio.replace(tzinfo=timezone.utc)
    if vencimiento.tzinfo is None:
        vencimiento = vencimiento.replace(tzinfo=timezone.utc)
    return inicio <= ahora < vencimiento


def exigir_suscripcion(db: Session) -> None:
    if not esta_vigente(obtener_suscripcion(db)):
        raise AccesoProhibidoError(
            "La suscripcion de esta institucion no esta vigente"
        )
