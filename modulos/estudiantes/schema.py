from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import date

class Revisar_Json_Crear_Estudiante(BaseModel):
    cuenta: str = Field(min_length=5, max_length=17)
    nombre: str = Field(min_length=3, max_length=25)
    correo: EmailStr
    telefono: Optional[str] = None
    fechaNacimiento: date
    carrera_id: int

class Revisar_Json_Editar_Estudiante(BaseModel):
    cuenta: Optional[str] = Field(default=None, min_length=5, max_length=17)
    nombre: Optional[str] = Field(default=None, min_length=3, max_length=25)
    correo: Optional[EmailStr] = None
    telefono: Optional[str] = None
    fechaNacimiento: Optional[date] = None
    carrera_id: Optional[int] = None
    estado: Optional[bool] = None


class Crear_Respuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    cuenta: str
    nombre: str
    correo: EmailStr
    telefono: Optional[str]
    fechaNacimiento: date
    carrera_id: int
    estado: bool

class Editar_Estudiante_Respuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    cuenta: str
    nombre: str
    correo: EmailStr
    telefono: Optional[str]
    fechaNacimiento: date
    carrera_id: int
    estado: bool