from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Revisar_Json_Crear_Asignatura(BaseModel):
    codigo: str = Field(min_length=1, max_length=20)
    nombre: str = Field(min_length=1, max_length=150)
    unidades_valorativas: int = Field(ge=1, le=20)
    carrera_id: int
    requisito_id: Optional[int] = None
    activo: bool = True


class Revisar_Json_Editar_Asignatura(BaseModel):
    codigo: str = Field(min_length=1, max_length=20)
    nombre: str = Field(min_length=1, max_length=150)
    unidades_valorativas: int = Field(ge=1, le=20)
    carrera_id: int
    requisito_id: Optional[int] = None
    activo: bool = True


class Editar_Parcialmente_Asignatura(BaseModel):
    codigo: Optional[str] = Field(default=None, min_length=1, max_length=20)
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=150)
    unidades_valorativas: Optional[int] = Field(default=None, ge=1, le=20)
    carrera_id: Optional[int] = None
    requisito_id: Optional[int] = None
    activo: Optional[bool] = None


class AsignaturaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    nombre: str
    unidades_valorativas: int
    carrera_id: int
    requisito_id: Optional[int]
    activo: bool
