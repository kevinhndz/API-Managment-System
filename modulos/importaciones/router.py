from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.importaciones.service import aplicar, previsualizar
from modulos.importaciones.schema import ConfirmarImportacion, ErrorImportacion
from utils.auth import permiso_admin

router = APIRouter(prefix="/importaciones", tags=["Importaciones"], dependencies=[Depends(permiso_admin)])


@router.post("/vista-previa")
async def vista_previa(request: Request, tipo: str = Query(...), nombre: str = Header(..., alias="X-File-Name"), db: Session = Depends(abrir_puerta_bd)):
    try:
        return previsualizar(db, tipo, await request.body(), nombre)
    except ErrorImportacion as exc:
        raise HTTPException(exc.status_code, exc.detail) from exc


@router.post("/confirmar")
def confirmar(datos: ConfirmarImportacion, db: Session = Depends(abrir_puerta_bd)):
    try:
        return aplicar(db, datos.token)
    except ErrorImportacion as exc:
        raise HTTPException(exc.status_code, exc.detail) from exc
