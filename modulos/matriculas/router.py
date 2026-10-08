from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from core.schema import RespuestaPaginada
from database.almacen import abrir_puerta_bd
from modulos.matriculas.schema import *
from modulos.matriculas.service import MatriculasService as s
from utils.auth import permiso_admin, permiso_usuario

router = APIRouter(prefix="/matriculas", tags=["Matriculas"])


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=MatriculaResponse)
def crear_matricula(
    json: Revisar_Json_Crear_Matricula, db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return s.crear_service(db, json)


@router.get("/", response_model=RespuestaPaginada[MatriculaResponse])
def listar_matriculas(
    pagina_actual: int = Query(1, ge=1),
    limite: int = Query(10, ge=1, le=100),
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    docente_id = None if usuario["rol"].casefold() in {"admin", "administrador"} else usuario["docente_id"]
    return s.listar_service(db, pagina_actual, limite, docente_id)


@router.get("/{id}", response_model=MatriculaResponse)
def buscar_matricula(id: int, db: Session = Depends(abrir_puerta_bd), administrador: dict = Depends(permiso_admin)):
    return s.buscar_service(db, id)


@router.put("/{id}", response_model=MatriculaResponse)
def editar_matricula(
    id: int, json: Revisar_Json_Editar_Matricula, db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return s.editar_service(db, id, json)


@router.patch("/{id}", response_model=MatriculaResponse)
def editar_parcialmente_matricula(
    id: int, json: Editar_Parcialmente_Matricula, db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return s.editar_parcialmente_service(db, id, json)


@router.patch("/{id}/cancelar", response_model=MatriculaResponse)
def cancelar_matricula(id: int, db: Session = Depends(abrir_puerta_bd), administrador: dict = Depends(permiso_admin)):
    return s.cancelar_service(db, id)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_matricula(id: int, db: Session = Depends(abrir_puerta_bd), administrador: dict = Depends(permiso_admin)):
    s.eliminar_service(db, id)
