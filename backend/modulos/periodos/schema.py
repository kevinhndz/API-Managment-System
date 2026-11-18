from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Revisar_Json_Crear_Periodo(BaseModel):
    anio: int = Field(ge=2000)
    numero: int = Field(ge=1, le=3)
    fecha_inicio: date
    fecha_fin: date
    activo: bool = True


class Revisar_Json_Editar_Periodo(BaseModel):
    anio: int = Field(ge=2000)
    numero: int = Field(ge=1, le=3)
    fecha_inicio: date
    fecha_fin: date
    activo: bool = True


class Editar_Parcialmente_Periodo(BaseModel):
    anio: Optional[int] = Field(default=None, ge=2000)
    numero: Optional[int] = Field(default=None, ge=1, le=3)
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    activo: Optional[bool] = None


class PeriodoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    anio: int
    numero: int
    fecha_inicio: date
    fecha_fin: date
    activo: bool
