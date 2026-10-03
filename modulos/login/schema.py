from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class Revisar_Json_Crear_Usuario(BaseModel):
    usuario: str = Field(min_length=3, max_length=80)
    contrasena: str = Field(min_length=6, max_length=100)
    rol: str = "Docente"
    docente_id: Optional[int] = None
    activo: bool = True


class Revisar_Json_Editar_Usuario(BaseModel):
    usuario: str = Field(min_length=3, max_length=80)
    contrasena: Optional[str] = Field(default=None, min_length=6, max_length=100)
    rol: str
    docente_id: Optional[int] = None
    activo: bool = True


class LoginRequest(BaseModel):
    usuario: str
    contrasena: str


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    usuario: str
    rol: str
    docente_id: Optional[int]
    activo: bool


class TokenResponse(BaseModel):
    token: str
    tipo: str = "bearer"
