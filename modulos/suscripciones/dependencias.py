from fastapi import Depends
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.suscripciones.service import exigir_suscripcion as validar_suscripcion
from utils.auth import permiso_usuario


def exigir_suscripcion(
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
) -> None:
    validar_suscripcion(db)


def require_active_university_subscription(
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
) -> None:
    """Comprueba la suscripcion de la institucion del JWT, no la del usuario."""
    if usuario["institucion_id"] != db.info["institucion_id"]:
        from core.excepciones import AccesoProhibidoError
        raise AccesoProhibidoError("La sesion no corresponde a esta institucion")
    validar_suscripcion(db)
