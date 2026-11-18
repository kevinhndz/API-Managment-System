from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.finanzas.schema import CrearObligacion, ObligacionResponse, PagoResponse, RegistrarPago
from modulos.finanzas.service import crear_obligacion, listar_saldos, registrar_pago
from modulos.suscripciones.dependencias import exigir_suscripcion
from utils.auth import permiso_admin

router = APIRouter(prefix="/finanzas", tags=["Finanzas"], dependencies=[Depends(permiso_admin), Depends(exigir_suscripcion)])


@router.get("/obligaciones", response_model=list[ObligacionResponse])
def obligaciones(tipo: Literal["ESTUDIANTE", "DOCENTE"] | None = None, mes: str | None = None,
                 estado: Literal["PAGADO", "PARCIAL", "VENCIDO", "PENDIENTE"] | None = None,
                 db: Session = Depends(abrir_puerta_bd)):
    return listar_saldos(db, tipo, mes, estado)


@router.post("/obligaciones", response_model=ObligacionResponse, status_code=201)
def nueva_obligacion(datos: CrearObligacion, db: Session = Depends(abrir_puerta_bd)):
    obligacion = crear_obligacion(db, datos)
    return next(item for item in listar_saldos(db, obligacion.tipo, obligacion.mes) if item["id"] == obligacion.id)


@router.post("/obligaciones/{obligacion_id}/pagos", response_model=PagoResponse, status_code=201)
def nuevo_pago(obligacion_id: int, datos: RegistrarPago, db: Session = Depends(abrir_puerta_bd)):
    return registrar_pago(db, obligacion_id, datos)
