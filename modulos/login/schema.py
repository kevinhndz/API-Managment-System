from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


def validar_contrasena_nueva(valor: str) -> str:
    if len(valor.encode("utf-8")) > 72:
        raise ValueError("La contraseña no puede superar 72 bytes.")
    return valor


def normalizar_rol(valor: str) -> str:
    roles = {
        "docente": "Docente",
        "admin": "Administrador",
        "administrador": "Administrador",
    }
    rol = roles.get(valor.strip().casefold())
    if rol is None:
        raise ValueError("El rol debe ser Docente o Administrador.")
    return rol


class Revisar_Json_Crear_Usuario(BaseModel):
    usuario: str = Field(min_length=3, max_length=80)
    contrasena: str = Field(min_length=12, max_length=72)
    rol: Literal["Docente", "Administrador", "Admin"] = "Docente"
    docente_id: Optional[int] = None
    activo: bool = True

    @field_validator("contrasena")
    @classmethod
    def validar_longitud_bcrypt(cls, valor: str) -> str:
        return validar_contrasena_nueva(valor)

    @field_validator("rol", mode="before")
    @classmethod
    def normalizar_rol_usuario(cls, valor: str) -> str:
        return normalizar_rol(valor)


class Revisar_Json_Editar_Usuario(BaseModel):
    usuario: str = Field(min_length=3, max_length=80)
    contrasena: Optional[str] = Field(default=None, min_length=12, max_length=72)
    rol: Literal["Docente", "Administrador", "Admin"]
    docente_id: Optional[int] = None
    activo: bool = True

    @field_validator("contrasena")
    @classmethod
    def validar_longitud_bcrypt(cls, valor: Optional[str]) -> Optional[str]:
        return validar_contrasena_nueva(valor) if valor is not None else None

    @field_validator("rol", mode="before")
    @classmethod
    def normalizar_rol_usuario(cls, valor: str) -> str:
        return normalizar_rol(valor)


class LoginRequest(BaseModel):
    usuario: str = Field(min_length=1, max_length=80)
    contrasena: str = Field(min_length=1, max_length=100)


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


class SesionResponse(BaseModel):
    autenticada: bool = True
