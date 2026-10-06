from pydantic import BaseModel, Field


# Este schema representa el mensaje que envia el frontend.
class ChatbotMensaje(BaseModel):
    mensaje: str


# Este schema representa una respuesta del agente y un archivo opcional.
class ChatbotRespuesta(BaseModel):
    respuesta: str
    filas: list[dict] = Field(default_factory=list)
    archivo: str | None = None
