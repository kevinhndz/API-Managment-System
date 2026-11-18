from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.notificaciones.schema import NotificacionDocenteResponse
from modulos.notificaciones.service import listar_notificaciones_docentes, marcar_notificacion_leida
from utils.auth import permiso_admin


router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("/docentes", response_model=list[NotificacionDocenteResponse])
def listar(
    administrador: dict = Depends(permiso_admin),
    db: Session = Depends(abrir_puerta_bd),
):
    return listar_notificaciones_docentes(db, administrador["user_id"])


@router.post("/docentes/{evento_id}/leida", status_code=status.HTTP_204_NO_CONTENT)
def marcar_leida(
    evento_id: int,
    respuesta: Response,
    administrador: dict = Depends(permiso_admin),
    db: Session = Depends(abrir_puerta_bd),
):
    marcar_notificacion_leida(db, administrador["user_id"], evento_id)
    respuesta.status_code = status.HTTP_204_NO_CONTENT
