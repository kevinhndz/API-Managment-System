from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.suscripciones.schema import SuscripcionResponse
from modulos.suscripciones.service import esta_vigente, obtener_suscripcion
from utils.auth import permiso_admin


router = APIRouter(prefix="/suscripcion", tags=["Suscripcion"])


@router.get("/actual", response_model=SuscripcionResponse)
def suscripcion_actual(
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    suscripcion = obtener_suscripcion(db)
    if suscripcion is None:
        return {
            "plan": "SIN_PLAN",
            "estado": "INACTIVA",
            "inicia_en": None,
            "vence_en": None,
            "vigente": False,
        }
    return {
        "plan": suscripcion.plan,
        "estado": suscripcion.estado,
        "inicia_en": suscripcion.inicia_en,
        "vence_en": suscripcion.vence_en,
        "vigente": esta_vigente(suscripcion),
    }
