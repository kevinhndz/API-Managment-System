from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.schema import RespuestaPaginada
from database.almacen import abrir_puerta_bd
from modulos.estudiantes.schema import (
    Editar_Parcialmente_Estudiante,
    EstudianteResponse,
    Revisar_Json_Crear_Estudiante,
    Revisar_Json_Editar_Estudiante,
)
from modulos.estudiantes.service import EstudiantesService as s
from utils.auth import permiso_admin, permiso_usuario

router = APIRouter(prefix="/estudiantes", tags=["Estudiantes"])


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=EstudianteResponse
)
def crear_estudiante(
    json: Revisar_Json_Crear_Estudiante,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return s.crear_service(db, json)


@router.get("/", response_model=RespuestaPaginada[EstudianteResponse])
def listar_estudiantes(
    pagina_actual: int = Query(default=1, ge=1),
    limite: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    return s.listar_service(db, pagina_actual, limite)


@router.get("/{id}", response_model=EstudianteResponse)
def buscar_estudiante(
    id: int,
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    return s.buscar_service(db, id)


@router.put("/{id}", response_model=EstudianteResponse)
def editar_estudiante(
    id: int,
    json: Revisar_Json_Editar_Estudiante,
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    return s.editar_service(db, id, json)


@router.patch("/{id}", response_model=EstudianteResponse)
def editar_parcialmente_estudiante(
    id: int,
    json: Editar_Parcialmente_Estudiante,
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    return s.editar_parcialmente_service(db, id, json)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_estudiante(
    id: int,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    s.eliminar_service(db, id)
