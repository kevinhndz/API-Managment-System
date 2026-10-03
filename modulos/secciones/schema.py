from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class Revisar_Json_Crear_Seccion(BaseModel):
    codigo: str = Field(min_length=1, max_length=20)
    asignatura_id: int
    docente_id: int
    periodo_id: int
    aula_id: int
    dias: str = Field(min_length=1, max_length=30)
    hora_inicio: str = Field(min_length=4, max_length=10)
    hora_fin: str = Field(min_length=4, max_length=10)
    cupo_maximo: int = Field(ge=1)
    estado: str = "ABIERTA"


class Revisar_Json_Editar_Seccion(Revisar_Json_Crear_Seccion):
    pass


class Editar_Parcialmente_Seccion(BaseModel):
    codigo: Optional[str] = Field(default=None, min_length=1, max_length=20)
    asignatura_id: Optional[int] = None
    docente_id: Optional[int] = None
    periodo_id: Optional[int] = None
    aula_id: Optional[int] = None
    dias: Optional[str] = Field(default=None, min_length=1, max_length=30)
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    cupo_maximo: Optional[int] = Field(default=None, ge=1)
    estado: Optional[str] = None


class SeccionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    codigo: str
    asignatura_id: int
    docente_id: int
    periodo_id: int
    aula_id: int
    dias: str
    hora_inicio: str
    hora_fin: str
    cupo_maximo: int
    estado: str
