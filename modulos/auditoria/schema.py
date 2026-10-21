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
    ip_origen: str | None = None
    datos_anteriores: dict | None = None
    datos_nuevos: dict | None = None
    fecha: datetime
