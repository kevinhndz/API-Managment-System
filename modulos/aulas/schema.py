from pydantic import BaseModel, Field
from typing import Literal, Optional

class Revisar_Json_Crear_Aula(BaseModel):
    codigo: str = Field(min_length=2, max_length=20)
    edificio: Literal["Edificio Norte", "Edificio Sur", "Edificio UPH"]
    capacidad: int = Field(ge=20, le=65)  
    activo: bool = True  

class Revisar_Json_Editar_Aula(BaseModel):
    codigo: str = Field(min_length=2, max_length=20)
    edificio: Literal["Edificio Norte", "Edificio Sur", "Edificio UPH"]
    capacidad: int = Field(ge=20, le=65)
    activo: bool = True

class Editar_Parcialmente_Aula(BaseModel):
    codigo: Optional[str] = Field(min_length=2, max_length=20, default=None)
    edificio: Optional[Literal["Edificio Norte", "Edificio Sur", "Edificio UPH"]] = None
    capacidad: Optional[int] = Field(ge=20, le=65, default=None)
    activo: Optional[bool] = None