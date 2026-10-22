from fastapi import APIRouter, Depends, Header, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.importaciones.service import aplicar, previsualizar
from utils.auth import permiso_admin

router = APIRouter(prefix="/importaciones", tags=["Importaciones"], dependencies=[Depends(permiso_admin)])


class ConfirmarImportacion(BaseModel):
    token: str = Field(min_length=32, max_length=128)


@router.post("/vista-previa")
async def vista_previa(request: Request, tipo: str = Query(...), nombre: str = Header(..., alias="X-File-Name"), db: Session = Depends(abrir_puerta_bd)):
    return previsualizar(db, tipo, await request.body(), nombre)


@router.post("/confirmar")
def confirmar(datos: ConfirmarImportacion, db: Session = Depends(abrir_puerta_bd)):
    return aplicar(db, datos.token)
