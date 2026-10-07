from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict

EstadoMatricula = Literal["ACTIVA", "CANCELADA", "APROBADA", "REPROBADA"]


class Revisar_Json_Crear_Matricula(BaseModel):
    estudiante_id: int
    seccion_id: int
    fecha_matricula: date
    estado: EstadoMatricula = "ACTIVA"


class Revisar_Json_Editar_Matricula(BaseModel):
    estudiante_id: int
    seccion_id: int
    fecha_matricula: date
    estado: EstadoMatricula


class Editar_Parcialmente_Matricula(BaseModel):
    estudiante_id: Optional[int] = None
    seccion_id: Optional[int] = None
    fecha_matricula: Optional[date] = None
    estado: Optional[EstadoMatricula] = None


class MatriculaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    estudiante_id: int
    seccion_id: int
    fecha_matricula: date
    estado: str
