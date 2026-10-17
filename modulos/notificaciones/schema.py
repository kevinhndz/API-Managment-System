from datetime import datetime

from pydantic import BaseModel


class NotificacionDocenteResponse(BaseModel):
    id: int
    usuario: str
    accion: str
    modulo: str
    registro_id: int | None
    descripcion: str
    fecha: datetime
    leida: bool
