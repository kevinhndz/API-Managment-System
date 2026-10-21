from datetime import datetime, timezone

from fastapi import Depends
from sqlalchemy.orm import Session

from core.excepciones import AccesoProhibidoError
from database.almacen import abrir_puerta_bd
from modulos.suscripciones.tabla import Suscripciones
from utils.auth import permiso_usuario


def obtener_suscripcion(db: Session) -> Suscripciones | None:
    institucion_id = db.info.get("institucion_id")
    if institucion_id is None:
        raise AccesoProhibidoError("No se encontro el contexto de institucion")
    return db.query(Suscripciones).filter(
        Suscripciones.institucion_id == institucion_id
    ).one_or_none()


def esta_vigente(suscripcion: Suscripciones | None) -> bool:
    if suscripcion is None or suscripcion.estado not in {"PRUEBA", "ACTIVA"}:
        return False
    ahora = datetime.now(timezone.utc)
    return suscripcion.inicia_en <= ahora < suscripcion.vence_en


def exigir_suscripcion(
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
) -> None:
    if not esta_vigente(obtener_suscripcion(db)):
        raise AccesoProhibidoError(
            "La suscripcion de esta institucion no esta vigente"
        )
