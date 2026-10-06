from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.chatbot.schema import ChatbotMensaje, ChatbotRespuesta
from modulos.chatbot.service import ChatbotService


# Este router expone el agente como una funcion de negocio segura.
router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


# Esta ruta recibe lenguaje natural y devuelve datos o un reporte.
@router.post("/mensaje", response_model=ChatbotRespuesta)
def enviar_mensaje(json: ChatbotMensaje, db: Session = Depends(abrir_puerta_bd)):
    return ChatbotService.responder(db, json.mensaje)


# Esta ruta permite descargar el reporte creado por una consulta previa.
@router.get("/reportes/{nombre}")
def descargar_reporte(nombre: str):
    ruta = Path("reportes_generados") / Path(nombre).name
    return FileResponse(ruta, filename=ruta.name, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
