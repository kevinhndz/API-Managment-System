from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.auditoria.schema import EventoResponse
from modulos.auditoria.service import AuditoriaService as s


router = APIRouter(prefix="/auditoria", tags=["Auditoria"])


@router.get("/", response_model=list[EventoResponse])
def listar_actividad(
    modulo: str | None = None,
    accion: str | None = None,
    usuario: str | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    limite: int = Query(50, ge=1, le=200),
    db: Session = Depends(abrir_puerta_bd),
):
    return s.listar_actividad(db, modulo, accion, usuario, desde, hasta, limite)
