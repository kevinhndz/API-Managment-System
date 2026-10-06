from pydantic import BaseModel, Field


# Representa el mensaje que envia el frontend.
class ChatbotMensaje(BaseModel):
    # Rechaza mensajes vacios antes de consultar Ollama.
    mensaje: str = Field(min_length=1, max_length=500)


# Representa la respuesta que recibe el frontend.
class ChatbotRespuesta(BaseModel):
    # Contiene una explicacion natural generada por el modelo.
    respuesta: str
    # Contiene el total usado para construir la respuesta.
    total: int | None = None
