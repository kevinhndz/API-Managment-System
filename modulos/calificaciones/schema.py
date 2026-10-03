from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class Revisar_Json_Crear_Calificacion(BaseModel):
    matricula_id: int
    primer_parcial: Decimal = Field(ge=0, le=100)
    segundo_parcial: Decimal = Field(ge=0, le=100)
    tercer_parcial: Decimal = Field(ge=0, le=100)
    observacion: Optional[str] = None

class Revisar_Json_Editar_Calificacion(Revisar_Json_Crear_Calificacion):
    pass

class Editar_Parcialmente_Calificacion(BaseModel):
    primer_parcial: Optional[Decimal] = Field(default=None, ge=0, le=100)
    segundo_parcial: Optional[Decimal] = Field(default=None, ge=0, le=100)
    tercer_parcial: Optional[Decimal] = Field(default=None, ge=0, le=100)
    observacion: Optional[str] = None

class CalificacionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    matricula_id: int
    primer_parcial: Decimal
    segundo_parcial: Decimal
    tercer_parcial: Decimal
    nota_final: Decimal
    observacion: Optional[str]
