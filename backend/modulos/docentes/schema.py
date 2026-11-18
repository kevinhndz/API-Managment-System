from typing import Optional
from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class Revisar_Json_Crear_Docente(BaseModel):
    numero_empleado: str = Field(min_length=1, max_length=20)
    nombres: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)
    correo: str = Field(min_length=3, max_length=150)
    especialidad: str = Field(min_length=1, max_length=120)
    cargo: str | None = Field(default=None, max_length=120)
    departamento: str | None = Field(default=None, max_length=120)
    tipo_contrato: str | None = Field(default=None, max_length=80)
    fecha_ingreso: date | None = None
    estado: bool = True


class Revisar_Json_Editar_Docente(BaseModel):
    numero_empleado: str = Field(min_length=1, max_length=20)
    nombres: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)
    correo: str = Field(min_length=3, max_length=150)
    especialidad: str = Field(min_length=1, max_length=120)
    cargo: str | None = Field(default=None, max_length=120)
    departamento: str | None = Field(default=None, max_length=120)
    tipo_contrato: str | None = Field(default=None, max_length=80)
    fecha_ingreso: date | None = None
    estado: bool = True


class Editar_Parcialmente_Docente(BaseModel):
    numero_empleado: Optional[str] = Field(default=None, min_length=1, max_length=20)
    nombres: Optional[str] = Field(default=None, min_length=1, max_length=100)
    apellidos: Optional[str] = Field(default=None, min_length=1, max_length=100)
    correo: Optional[str] = Field(default=None, min_length=3, max_length=150)
    especialidad: Optional[str] = Field(default=None, min_length=1, max_length=120)
    cargo: str | None = Field(default=None, max_length=120)
    departamento: str | None = Field(default=None, max_length=120)
    tipo_contrato: str | None = Field(default=None, max_length=80)
    fecha_ingreso: date | None = None
    estado: Optional[bool] = None


class DocenteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero_empleado: str
    nombres: str
    apellidos: str
    foto: str | None = None
    correo: str
    especialidad: str
    cargo: str | None = None
    departamento: str | None = None
    tipo_contrato: str | None = None
    fecha_ingreso: date | None = None
    estado: bool


class CargaDocenteResponse(BaseModel):
    docente_id: int
    numero_empleado: str
    nombres: str
    apellidos: str
    tipo_contrato: str | None
    departamento: str | None
    seccion: str
    estado_seccion: str
    dias: str
    hora_inicio: str
    hora_fin: str
    asignatura_id: int
    codigo_asignatura: str
    asignatura: str
    periodo_id: int
    anio: int
    numero: int
    vigente: bool
