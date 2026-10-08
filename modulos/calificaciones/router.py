from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from core.schema import RespuestaPaginada
from database.almacen import abrir_puerta_bd
from modulos.calificaciones.schema import *
from modulos.calificaciones.service import CalificacionesService as s
from utils.auth import permiso_admin, permiso_usuario

router = APIRouter(prefix="/calificaciones", tags=["Calificaciones"])


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=CalificacionResponse
)
def crear_calificacion(
    json: Revisar_Json_Crear_Calificacion,
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    docente_id = None if usuario["rol"].casefold() in {"admin", "administrador"} else usuario["docente_id"]
    return s.crear_service(db, json, docente_id)


@router.get("/", response_model=RespuestaPaginada[CalificacionResponse])
def listar_calificaciones(
    pagina_actual: int = Query(1, ge=1),
    limite: int = Query(10, ge=1, le=100),
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    docente_id = None if usuario["rol"].casefold() in {"admin", "administrador"} else usuario["docente_id"]
    return s.listar_service(db, pagina_actual, limite, docente_id)


@router.get("/{id}", response_model=CalificacionResponse)
def buscar_calificacion(
    id: int,
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    docente_id = None if usuario["rol"].casefold() in {"admin", "administrador"} else usuario["docente_id"]
    return s.buscar_service(db, id, docente_id)


@router.put("/{id}", response_model=CalificacionResponse)
def editar_calificacion(
    id: int,
    json: Revisar_Json_Editar_Calificacion,
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    docente_id = None if usuario["rol"].casefold() in {"admin", "administrador"} else usuario["docente_id"]
    return s.editar_service(db, id, json, docente_id)


@router.patch("/{id}", response_model=CalificacionResponse)
def editar_parcialmente_calificacion(
    id: int,
    json: Editar_Parcialmente_Calificacion,
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    docente_id = None if usuario["rol"].casefold() in {"admin", "administrador"} else usuario["docente_id"]
    return s.editar_parcialmente_service(db, id, json, docente_id)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_calificacion(
    id: int,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    s.eliminar_service(db, id)
