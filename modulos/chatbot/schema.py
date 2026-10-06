from pydantic import BaseModel


# Este schema representa el mensaje que envia el frontend.
class ChatbotMensaje(BaseModel):
    mensaje: str


# Este schema representa una respuesta del agente y un archivo opcional.
class ChatbotRespuesta(BaseModel):
    respuesta: str
    filas: list[dict] = []
    archivo: str | None = None

