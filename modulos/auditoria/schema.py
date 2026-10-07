from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EventoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int | None
    usuario: str
    accion: str
    modulo: str
    registro_id: int | None
    descripcion: str
    fecha: datetime
