from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.chatbot.schema import ChatbotMensaje, ChatbotRespuesta
from modulos.chatbot.service import responder


# Agrupa las rutas del agente academico.
router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


# Recibe una pregunta y devuelve una respuesta de solo lectura.
@router.post("/mensaje", response_model=ChatbotRespuesta)
def enviar_mensaje(json: ChatbotMensaje, db: Session = Depends(abrir_puerta_bd)):
    # Envia la pregunta al coordinador del agente.
    return responder(db, json.mensaje)
