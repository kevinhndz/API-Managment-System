from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class Revisar_Json_Crear_Matricula(BaseModel):
    estudiante_id: int
    seccion_id: int
    fecha_matricula: date
    estado: str = "ACTIVA"


class Revisar_Json_Editar_Matricula(BaseModel):
    estudiante_id: int
    seccion_id: int
    fecha_matricula: date
    estado: str


class Editar_Parcialmente_Matricula(BaseModel):
    estudiante_id: Optional[int] = None
    seccion_id: Optional[int] = None
    fecha_matricula: Optional[date] = None
    estado: Optional[str] = None


class MatriculaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    estudiante_id: int
    seccion_id: int
    fecha_matricula: date
    estado: str
