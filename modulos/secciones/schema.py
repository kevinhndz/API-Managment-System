from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from modulos.secciones.reglas import convertir_hora, normalizar_dias, normalizar_hora

EstadoSeccion = Literal["ABIERTA", "CERRADA", "CANCELADA"]


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
    estado: EstadoSeccion = "ABIERTA"

    @field_validator("dias")
    @classmethod
    def validar_dias(cls, valor: str) -> str:
        normalizar_dias(valor)
        return valor

    @field_validator("hora_inicio", "hora_fin")
    @classmethod
    def validar_hora(cls, valor: str) -> str:
        return normalizar_hora(valor)

    @model_validator(mode="after")
    def validar_rango_horario(self):
        if convertir_hora(self.hora_fin) <= convertir_hora(self.hora_inicio):
            raise ValueError("La hora de cierre debe ser posterior a la hora de inicio.")
        return self


class Revisar_Json_Editar_Seccion(Revisar_Json_Crear_Seccion):
    pass


class Editar_Parcialmente_Seccion(BaseModel):
    codigo: Optional[str] = Field(default=None, min_length=1, max_length=20)
    asignatura_id: Optional[int] = None
    docente_id: Optional[int] = None
    periodo_id: Optional[int] = None
    aula_id: Optional[int] = None
    dias: Optional[str] = Field(default=None, min_length=1, max_length=30)
    hora_inicio: Optional[str] = Field(default=None, min_length=4, max_length=10)
    hora_fin: Optional[str] = Field(default=None, min_length=4, max_length=10)
    cupo_maximo: Optional[int] = Field(default=None, ge=1)
    estado: Optional[EstadoSeccion] = None

    @field_validator("dias")
    @classmethod
    def validar_dias(cls, valor: Optional[str]) -> Optional[str]:
        if valor is not None:
            normalizar_dias(valor)
        return valor

    @field_validator("hora_inicio", "hora_fin")
    @classmethod
    def validar_hora(cls, valor: Optional[str]) -> Optional[str]:
        return normalizar_hora(valor) if valor is not None else None


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
