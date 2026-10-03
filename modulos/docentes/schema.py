from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Revisar_Json_Crear_Docente(BaseModel):
    numero_empleado: str = Field(min_length=1, max_length=20)
    nombres: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)
    correo: str = Field(min_length=3, max_length=150)
    especialidad: str = Field(min_length=1, max_length=120)
    estado: bool = True


class Revisar_Json_Editar_Docente(BaseModel):
    numero_empleado: str = Field(min_length=1, max_length=20)
    nombres: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)
    correo: str = Field(min_length=3, max_length=150)
    especialidad: str = Field(min_length=1, max_length=120)
    estado: bool = True


class Editar_Parcialmente_Docente(BaseModel):
    numero_empleado: Optional[str] = Field(default=None, min_length=1, max_length=20)
    nombres: Optional[str] = Field(default=None, min_length=1, max_length=100)
    apellidos: Optional[str] = Field(default=None, min_length=1, max_length=100)
    correo: Optional[str] = Field(default=None, min_length=3, max_length=150)
    especialidad: Optional[str] = Field(default=None, min_length=1, max_length=120)
    estado: Optional[bool] = None


class DocenteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero_empleado: str
    nombres: str
    apellidos: str
    correo: str
    especialidad: str
    estado: bool
