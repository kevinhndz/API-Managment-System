from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from core.schema import RespuestaPaginada
from modulos.docentes.schema import (
    DocenteResponse,
    Editar_Parcialmente_Docente,
    Revisar_Json_Crear_Docente,
    Revisar_Json_Editar_Docente,
)
from modulos.docentes.service import DocentesService as s


router = APIRouter(prefix="/docentes", tags=["Docentes"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=DocenteResponse)
def crear_docente(json: Revisar_Json_Crear_Docente, db: Session = Depends(abrir_puerta_bd)):
    return s.crear_service(db, json)


@router.get("/", response_model=RespuestaPaginada[DocenteResponse])
def listar_docentes(
    pagina_actual: int = Query(default=1, ge=1),
    limite: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(abrir_puerta_bd),
):
    return s.listar_service(db, pagina_actual, limite)


@router.get("/{id}", response_model=DocenteResponse)
def buscar_docente(id: int, db: Session = Depends(abrir_puerta_bd)):
    return s.buscar_service(db, id)


@router.put("/{id}", response_model=DocenteResponse)
def editar_docente(
    id: int,
    json: Revisar_Json_Editar_Docente,
    db: Session = Depends(abrir_puerta_bd),
):
    return s.editar_service(db, id, json)


@router.patch("/{id}", response_model=DocenteResponse)
def editar_parcialmente_docente(
    id: int,
    json: Editar_Parcialmente_Docente,
    db: Session = Depends(abrir_puerta_bd),
):
    return s.editar_parcialmente_service(db, id, json)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_docente(id: int, db: Session = Depends(abrir_puerta_bd)):
    s.eliminar_service(db, id)
