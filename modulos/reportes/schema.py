from datetime import date
from typing import Optional
from pydantic import BaseModel


class ReporteMatriculaItem(BaseModel):
    estudiante_id: int
    estudiante: str
    cuenta: str
    carrera: str
    asignatura: str
    seccion: str
    periodo: int
    estado: str
    fecha_matricula: date
    nota_final: Optional[float] = None


class ReporteSeccionItem(BaseModel):
    seccion: str
    asignatura: str
    docente: str
    periodo: int
    aula: int
    estado: str
    cupo_maximo: int
    matriculados: int
