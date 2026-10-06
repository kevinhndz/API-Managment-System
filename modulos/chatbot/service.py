import json

import requests
from sqlalchemy.orm import Session

from core.config import settings
from modulos.estudiantes.tools import contar_estudiantes_activos


# Describe la unica herramienta habilitada en esta primera etapa.
def herramientas_estudiantes() -> list[dict]:
    # Devuelve el formato de function calling que entiende Ollama.
    return [{
        "type": "function",
        "function": {
            "name": "contar_estudiantes_activos",
            "description": "Cuenta estudiantes activos registrados en el sistema.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    }]


# Ejecuta solo funciones conocidas y nunca codigo enviado por el modelo.
def ejecutar_herramienta(db: Session, nombre: str) -> dict:
    # Comprueba que el nombre solicitado sea exactamente el permitido.
    if nombre != "contar_estudiantes_activos":
        return {"error": "Herramienta no habilitada en esta etapa."}
    # Delega la consulta al modulo propietario de estudiantes.
    return contar_estudiantes_activos(db)


# Coordina frontend, Ollama, herramienta y respuesta final.
def responder(db: Session, mensaje: str) -> dict:
    # Define el comportamiento del modelo para esta primera pregunta.
    sistema = "Responde en espanol sin acentos. Solo puedes responder cuántos estudiantes activos hay. Para esa pregunta debes usar la herramienta. Si preguntan otra cosa, indica que aun no esta habilitada. No inventes datos."
    # Guarda el mensaje inicial en el formato de la API de Ollama.
    mensajes = [{"role": "system", "content": sistema}, {"role": "user", "content": mensaje}]
    # Envia el mensaje y la herramienta al modelo local.
    respuesta = requests.post(f"{settings.OLLAMA_URL}/api/chat", json={"model": settings.OLLAMA_MODEL, "messages": mensajes, "tools": herramientas_estudiantes(), "stream": False}, timeout=90)
    # Convierte errores HTTP en una excepcion visible para FastAPI.
    respuesta.raise_for_status()
    # Extrae el mensaje generado por Ollama.
    mensaje_modelo = respuesta.json().get("message", {})
    # Lee las llamadas de herramientas que el modelo haya decidido usar.
    llamadas = mensaje_modelo.get("tool_calls", [])
    # Usa una recuperacion directa para que el modelo pequeno no deje la consulta sin resultado.
    if llamadas:
        resultado = ejecutar_herramienta(db, llamadas[0]["function"]["name"])
    elif "activo" in mensaje.lower() and "estudiante" in mensaje.lower():
        resultado = ejecutar_herramienta(db, "contar_estudiantes_activos")
    else:
        resultado = {"total": None}
    # Construye el texto final sin exponer JSON al usuario.
    if resultado.get("total") is not None:
        return {"respuesta": f"Hay {resultado['total']} estudiantes activos registrados en el sistema.", "total": resultado["total"]}
    # Informa claramente que las demas preguntas se agregaran despues.
    return {"respuesta": "Por ahora solo puedo responder cuántos estudiantes activos hay.", "total": None}
