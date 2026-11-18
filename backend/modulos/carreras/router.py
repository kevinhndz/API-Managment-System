from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from core.schema import RespuestaPaginada
from modulos.carreras.schema import (
    CarreraResponse,
    Editar_Parcialmente_Carrera,
    Revisar_Json_Crear_Carrera,
    Revisar_Json_Editar_Carrera,
)
from modulos.carreras.service import CarrerasService as s
from utils.auth import permiso_admin, permiso_usuario

router = APIRouter(prefix="/carreras", tags=["Carreras"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=CarreraResponse)
def crear_carrera(
    json: Revisar_Json_Crear_Carrera, db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return s.crear_service(db, json)


@router.get("/", response_model=RespuestaPaginada[CarreraResponse])
def listar_carreras(
    pagina_actual: int = Query(default=1, ge=1),
    limite: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    return s.listar_service(db, pagina_actual, limite)


@router.get("/{id}", response_model=CarreraResponse)
def buscar_carrera(id: int, db: Session = Depends(abrir_puerta_bd), usuario: dict = Depends(permiso_usuario)):
    return s.buscar_service(db, id)


@router.put("/{id}", response_model=CarreraResponse)
def editar_carrera(
    id: int,
    json: Revisar_Json_Editar_Carrera,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return s.editar_service(db, id, json)


@router.patch("/{id}", response_model=CarreraResponse)
def editar_parcialmente_carrera(
    id: int,
    json: Editar_Parcialmente_Carrera,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return s.editar_parcialmente_service(db, id, json)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_carrera(id: int, db: Session = Depends(abrir_puerta_bd), administrador: dict = Depends(permiso_admin)):
    s.eliminar_service(db, id)
