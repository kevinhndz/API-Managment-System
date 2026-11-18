from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SuscripcionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan: str
    estado: str
    inicia_en: datetime | None
    vence_en: datetime | None
    vigente: bool
