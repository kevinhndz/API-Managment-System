from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Revisar_Json_Crear_Carrera(BaseModel):
    codigo: str = Field(min_length=1, max_length=20)
    nombre: str = Field(min_length=1, max_length=150)
    duracion_anios: int = Field(ge=1)
    activo: bool = True


class Revisar_Json_Editar_Carrera(BaseModel):
    codigo: str = Field(min_length=1, max_length=20)
    nombre: str = Field(min_length=1, max_length=150)
    duracion_anios: int = Field(ge=1)
    activo: bool = True


class Editar_Parcialmente_Carrera(BaseModel):
    codigo: Optional[str] = Field(default=None, min_length=1, max_length=20)
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=150)
    duracion_anios: Optional[int] = Field(default=None, ge=1)
    activo: Optional[bool] = None


class CarreraResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    nombre: str
    duracion_anios: int
    activo: bool
