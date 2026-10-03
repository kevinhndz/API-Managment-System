from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.schema import RespuestaPaginada
from database.almacen import abrir_puerta_bd
from modulos.asignaturas.schema import *
from modulos.asignaturas.service import AsignaturasService as s

router = APIRouter(prefix="/asignaturas", tags=["Asignaturas"])

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=AsignaturaResponse)
def crear_asignatura(json: Revisar_Json_Crear_Asignatura, db: Session = Depends(abrir_puerta_bd)):
    return s.crear_service(db, json)

@router.get("/", response_model=RespuestaPaginada[AsignaturaResponse])
def listar_asignaturas(pagina_actual: int = Query(1, ge=1), limite: int = Query(10, ge=1, le=100), db: Session = Depends(abrir_puerta_bd)):
    return s.listar_service(db, pagina_actual, limite)

@router.get("/{id}", response_model=AsignaturaResponse)
def buscar_asignatura(id: int, db: Session = Depends(abrir_puerta_bd)):
    return s.buscar_service(db, id)

@router.put("/{id}", response_model=AsignaturaResponse)
def editar_asignatura(id: int, json: Revisar_Json_Editar_Asignatura, db: Session = Depends(abrir_puerta_bd)):
    return s.editar_service(db, id, json)

@router.patch("/{id}", response_model=AsignaturaResponse)
def editar_parcialmente_asignatura(id: int, json: Editar_Parcialmente_Asignatura, db: Session = Depends(abrir_puerta_bd)):
    return s.editar_parcialmente_service(db, id, json)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_asignatura(id: int, db: Session = Depends(abrir_puerta_bd)):
    s.eliminar_service(db, id)
