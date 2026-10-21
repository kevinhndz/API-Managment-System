from datetime import datetime

from pydantic import BaseModel


class VerificacionDocumento(BaseModel):
    folio: str
    tipo: str
    institucion: str
    emitido_en: datetime
    hash_pdf: str
