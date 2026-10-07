from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.auditoria.schema import EventoResponse
from modulos.auditoria.tabla import EventoAuditoria


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
    consulta = db.query(EventoAuditoria)

    if modulo:
        consulta = consulta.filter(EventoAuditoria.modulo == modulo)
    if accion:
        consulta = consulta.filter(EventoAuditoria.accion == accion)
    if usuario:
        consulta = consulta.filter(EventoAuditoria.usuario.ilike(f"%{usuario}%"))
    if desde:
        consulta = consulta.filter(EventoAuditoria.fecha >= datetime.combine(desde, time.min, timezone.utc))
    if hasta:
        consulta = consulta.filter(EventoAuditoria.fecha <= datetime.combine(hasta, time.max, timezone.utc))

    return consulta.order_by(EventoAuditoria.fecha.desc(), EventoAuditoria.id.desc()).limit(limite).all()
