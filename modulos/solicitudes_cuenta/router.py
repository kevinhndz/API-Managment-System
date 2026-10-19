from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from core.excepciones import RecursoNoEncontradoError
from core.config import settings
from core.rate_limit_service import limitar_peticion_por_ip
from database.almacen import abrir_puerta_bd
from modulos.login.tabla import Usuarios
from modulos.solicitudes_cuenta.schema import (
    AprobarSolicitudCuenta,
    ConfirmarVerificacionCorreo,
    SolicitarVerificacionCorreo,
    SolicitudCuentaCrear,
    SolicitudCuentaResponse,
)
from modulos.solicitudes_cuenta.service import (
    aprobar_solicitud,
    confirmar_codigo_correo,
    crear_solicitud,
    listar_solicitudes,
    rechazar_solicitud,
    solicitar_codigo_correo,
)
from utils.auth import permiso_admin


router = APIRouter(prefix="/solicitudes-cuenta", tags=["Solicitudes de cuenta"])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
def solicitar_cuenta(
    datos: SolicitudCuentaCrear,
    request: Request,
    db: Session = Depends(abrir_puerta_bd),
):
    limitar_peticion_por_ip(
        db,
        "registro-solicitud",
        request.client.host if request.client else "sin-ip",
        settings.SIGNUP_RATE_LIMIT_IP_ATTEMPTS,
        settings.SIGNUP_RATE_LIMIT_WINDOW_SECONDS,
    )
    crear_solicitud(db, datos)
    return {"detail": "Solicitud recibida. Un administrador la revisara."}


@router.post("/verificacion", status_code=status.HTTP_202_ACCEPTED)
def enviar_codigo_verificacion(
    datos: SolicitarVerificacionCorreo,
    request: Request,
    db: Session = Depends(abrir_puerta_bd),
):
    ip = request.client.host if request.client else "unknown"
    return solicitar_codigo_correo(db, str(datos.correo), ip)


@router.post("/verificacion/confirmar")
def verificar_codigo(
    datos: ConfirmarVerificacionCorreo,
    request: Request,
    db: Session = Depends(abrir_puerta_bd),
):
    ip = request.client.host if request.client else "unknown"
    return confirmar_codigo_correo(db, datos.verificacion_id, datos.codigo, ip)


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
