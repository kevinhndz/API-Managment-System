from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from core.schema import RespuestaPaginada
from modulos.aulas.schema import (
    AulaResponse,
    Editar_Parcialmente_Aula,
    Revisar_Json_Crear_Aula,
    Revisar_Json_Editar_Aula,
)
from modulos.aulas.service import AulasService as s


router = APIRouter(
    prefix = "/aulas",
    tags = ["Aulas"]
)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=AulaResponse)
def crear_aula(json: Revisar_Json_Crear_Aula, db: Session = Depends(abrir_puerta_bd)):
    return s.crear_service(db, json)


@router.get("/", response_model=RespuestaPaginada[AulaResponse])
def listar_aulas(
    pagina_actual: int = Query(default=1, ge=1),
    limite: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(abrir_puerta_bd),
):
    return s.listar_service(db, pagina_actual, limite)


@router.get("/{id}", response_model=AulaResponse)
def buscar_aula(id: int, db: Session = Depends(abrir_puerta_bd)):
    return s.buscar_service(db, id)


@router.put("/{id}", response_model=AulaResponse)
def editar_aula(
    id: int,
    json: Revisar_Json_Editar_Aula,
    db: Session = Depends(abrir_puerta_bd),
):
    return s.editar_service(db, id, json)


@router.patch("/{id}", response_model=AulaResponse)
def editar_parcialmente_aula(
    id: int,
    json: Editar_Parcialmente_Aula,
    db: Session = Depends(abrir_puerta_bd),
):
    return s.editar_parcialmente_service(db, id, json)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_aula(id: int, db: Session = Depends(abrir_puerta_bd)):
    s.eliminar_service(db, id)
