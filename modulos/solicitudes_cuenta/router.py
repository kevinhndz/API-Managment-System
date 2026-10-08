from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from core.excepciones import RecursoNoEncontradoError
from database.almacen import abrir_puerta_bd
from modulos.login.tabla import Usuarios
from modulos.solicitudes_cuenta.schema import (
    AprobarSolicitudCuenta,
    SolicitudCuentaCrear,
    SolicitudCuentaResponse,
)
from modulos.solicitudes_cuenta.service import (
    aprobar_solicitud,
    crear_solicitud,
    listar_solicitudes,
    rechazar_solicitud,
)
from modulos.solicitudes_cuenta.tabla import SolicitudesCuenta
from utils.auth import permiso_admin


router = APIRouter(prefix="/solicitudes-cuenta", tags=["Solicitudes de cuenta"])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
def solicitar_cuenta(datos: SolicitudCuentaCrear, db: Session = Depends(abrir_puerta_bd)):
    crear_solicitud(db, datos)
    return {"detail": "Solicitud recibida. Un administrador la revisara."}


@router.get("/", response_model=list[SolicitudCuentaResponse])
def obtener_solicitudes(
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return listar_solicitudes(db)


@router.post("/{solicitud_id}/aprobar", response_model=SolicitudCuentaResponse)
def aprobar(
    solicitud_id: int,
    datos: AprobarSolicitudCuenta,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return aprobar_solicitud(db, solicitud_id, datos, administrador["user_id"])


@router.post("/{solicitud_id}/rechazar", response_model=SolicitudCuentaResponse)
def rechazar(
    solicitud_id: int,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return rechazar_solicitud(db, solicitud_id, administrador["user_id"])
