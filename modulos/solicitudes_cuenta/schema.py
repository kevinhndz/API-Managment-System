from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from modulos.login.schema import validar_contrasena_nueva


class SolicitudCuentaCrear(BaseModel):
    nombre_completo: str = Field(min_length=3, max_length=160)
    correo: EmailStr
    usuario: str = Field(min_length=3, max_length=80)
    contrasena: str = Field(min_length=12, max_length=72)

    @field_validator("contrasena")
    @classmethod
    def validar_longitud_bcrypt(cls, valor: str) -> str:
        return validar_contrasena_nueva(valor)


class SolicitudCuentaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_completo: str
    correo: EmailStr
    usuario: str
    estado: str
    created_at: datetime


class AprobarSolicitudCuenta(BaseModel):
    rol: Literal["Docente", "Administrador"]
    docente_id: int | None = None

    @model_validator(mode="after")
    def validar_vinculo_docente(self):
        if self.rol == "Docente" and self.docente_id is None:
            raise ValueError("Para aprobar una cuenta docente, selecciona su registro institucional.")
        if self.rol == "Administrador" and self.docente_id is not None:
            raise ValueError("Una cuenta administradora no debe vincularse como docente.")
        return self
