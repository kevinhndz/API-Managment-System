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


class DocenteNuevoSolicitud(BaseModel):
    numero_empleado: str = Field(min_length=1, max_length=20)
    nombres: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)


class AprobarSolicitudCuenta(BaseModel):
    rol: Literal["Docente", "Administrador"]
    docente_id: int | None = None
    docente_nuevo: DocenteNuevoSolicitud | None = None

    @model_validator(mode="after")
    def validar_vinculo_docente(self):
        if self.rol == "Docente":
            if (self.docente_id is None) == (self.docente_nuevo is None):
                raise ValueError("Vincula un docente existente o completa los datos del nuevo docente.")
        elif self.docente_id is not None or self.docente_nuevo is not None:
            raise ValueError("Una cuenta administradora no debe vincularse como docente.")
        return self
