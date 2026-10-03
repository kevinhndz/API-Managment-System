from fastapi import Depends, APIRouter, status
from sqlalchemy.orm import Session
from database.almacen import abrir_puerta_bd
from modulos.aulas.schema import Revisar_Json_Crear_Aula
from modulos.aulas.service import AulasService as s


router = APIRouter(
    prefix = "/aulas",
    tags = ["Aulas"]
)


@router.post("/", status_code = 201)
def crear_aula(json: Revisar_Json_Crear_Aula, db: Session = Depends(abrir_puerta_bd)):
    return s.crear_service(db, json)