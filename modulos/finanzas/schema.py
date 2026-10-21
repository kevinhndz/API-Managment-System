from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class CrearObligacion(BaseModel):
    tipo: Literal["ESTUDIANTE", "DOCENTE"]
    estudiante_id: int | None = Field(default=None, gt=0)
    docente_id: int | None = Field(default=None, gt=0)
    mes: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")
    concepto: str = Field(min_length=2, max_length=160)
    monto: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    moneda: str = Field(default="HNL", pattern=r"^[A-Z]{3}$")
    vence_en: date


class RegistrarPago(BaseModel):
    referencia: str = Field(min_length=2, max_length=100)
    monto: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    fecha: date
    metodo: str = Field(min_length=2, max_length=40)


class ObligacionResponse(BaseModel):
    id: int
    tipo: str
    sujeto_id: int
    codigo: str
    persona: str
    mes: str
    concepto: str
    monto: Decimal
    pagado: Decimal
    saldo: Decimal
    moneda: str
    vence_en: date
    estado: str


class PagoResponse(BaseModel):
    id: int
    obligacion_id: int
    referencia: str
    monto: Decimal
    fecha: date
    metodo: str
