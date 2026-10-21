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
