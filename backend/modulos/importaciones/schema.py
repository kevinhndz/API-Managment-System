"""Datos de entrada y errores de la importacion institucional."""

from pydantic import BaseModel, Field


class ConfirmarImportacion(BaseModel):
    token: str = Field(min_length=32, max_length=128)


class ErrorImportacion(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)
