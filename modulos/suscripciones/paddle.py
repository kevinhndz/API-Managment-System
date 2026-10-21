"""Operaciones de Paddle Billing para una institucion."""

import hashlib
import hmac
import json
import time
from datetime import datetime, timezone

import requests
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from database.almacen import Instituciones
from modulos.suscripciones.tabla import EventosPaddle, Suscripciones
from modulos.suscripciones.service import esta_vigente


def _url_api() -> str:
    return "https://sandbox-api.paddle.com" if settings.PADDLE_ENVIRONMENT == "sandbox" else "https://api.paddle.com"


def _api(method: str, path: str, payload: dict) -> dict:
    clave = settings.PADDLE_API_KEY.get_secret_value()
    if not clave:
        raise HTTPException(503, "Falta configurar Paddle API")
    try:
        respuesta = requests.request(method, _url_api() + path, json=payload,
            headers={"Authorization": f"Bearer {clave}", "Content-Type": "application/json"}, timeout=15)
        respuesta.raise_for_status()
        return respuesta.json()["data"]
    except (requests.RequestException, ValueError, KeyError) as exc:
        raise HTTPException(502, "Paddle no pudo completar la operacion") from exc


def iniciar_checkout(db: Session, institucion_id: int) -> dict:
    institucion = db.get(Instituciones, institucion_id)
    if institucion is None or not institucion.activa:
        raise HTTPException(404, "Institucion no encontrada")
    if not settings.PADDLE_PRICE_ID or not settings.PADDLE_CLIENT_TOKEN:
        raise HTTPException(503, "Falta configurar el plan de Paddle")

    # La fila unica por institucion serializa dos inicios de checkout simultaneos.
    suscripcion = db.query(Suscripciones).filter_by(institucion_id=institucion_id).with_for_update().one_or_none()
    if suscripcion is None:
        raise HTTPException(409, "La institucion no tiene una suscripcion inicial")
    if suscripcion.estado == "ACTIVA" and esta_vigente(suscripcion):
        raise HTTPException(409, "La institucion ya tiene una suscripcion activa")
    if suscripcion.paddle_subscription_id and suscripcion.estado in {"ACTIVA", "ATRASADA", "PAUSADA"}:
        raise HTTPException(409, "La institucion ya tiene una suscripcion de Paddle; administrala desde el portal")
    if suscripcion.paddle_transaction_id and not suscripcion.paddle_subscription_id:
        return {"transaction_id": suscripcion.paddle_transaction_id, "client_token": settings.PADDLE_CLIENT_TOKEN, "environment": settings.PADDLE_ENVIRONMENT}

    transaccion = _api("POST", "/transactions", {
        "items": [{"price_id": settings.PADDLE_PRICE_ID, "quantity": 1}],
        "collection_mode": "automatic",
        "custom_data": {"institucion_id": str(institucion_id)},
    })
    suscripcion.paddle_transaction_id = transaccion["id"]
    suscripcion.paddle_price_id = settings.PADDLE_PRICE_ID
    db.commit()
    return {"transaction_id": transaccion["id"], "client_token": settings.PADDLE_CLIENT_TOKEN, "environment": settings.PADDLE_ENVIRONMENT}


def crear_portal(db: Session, suscripcion: Suscripciones) -> str:
    if not suscripcion.paddle_customer_id:
        raise HTTPException(409, "Esta institucion aun no tiene un cliente de Paddle")
    cuerpo = {"subscription_ids": [suscripcion.paddle_subscription_id]} if suscripcion.paddle_subscription_id else {}
    datos = _api("POST", f"/customers/{suscripcion.paddle_customer_id}/portal-sessions", cuerpo)
    return datos["urls"]["general"]["overview"]


def verificar_firma(cuerpo: bytes, encabezado: str | None) -> dict:
    secreto = settings.PADDLE_WEBHOOK_SECRET.get_secret_value()
    if not secreto:
        raise HTTPException(503, "Falta configurar la firma de Paddle")
    partes = [pieza.split("=", 1) for pieza in (encabezado or "").split(";") if "=" in pieza]
    valores = {clave.strip(): valor.strip() for clave, valor in partes}
    try:
        marca = int(valores["ts"])
        if abs(time.time() - marca) > 300:
            raise ValueError("Firma fuera de plazo")
        esperado = hmac.new(secreto.encode(), str(marca).encode() + b":" + cuerpo, hashlib.sha256).hexdigest()
        firmas = [valor.strip() for clave, valor in partes if clave.strip() == "h1"]
        if not any(hmac.compare_digest(esperado, firma) for firma in firmas):
            raise ValueError("Firma incorrecta")
        return json.loads(cuerpo)
    except (KeyError, ValueError, TypeError, UnicodeDecodeError) as exc:
        raise HTTPException(401, "Firma de Paddle invalida") from exc


def _fecha(valor: str | None) -> datetime | None:
    return datetime.fromisoformat(valor.replace("Z", "+00:00")) if valor else None


def procesar_evento(db: Session, evento: dict) -> bool:
    tipo = evento.get("event_type")
    if tipo not in {"transaction.completed", "subscription.created", "subscription.updated", "subscription.canceled", "subscription.past_due"}:
        return False
    datos = evento.get("data") or {}
    custom = datos.get("custom_data") or {}
    try:
        institucion_id = int(custom.get("institucion_id", ""))
    except (ValueError, TypeError):
        institucion_id = None
    # Los eventos posteriores pueden carecer de custom_data; el ID de Paddle es unico.
    if institucion_id is None:
        identificador = datos.get("id") if tipo.startswith("subscription.") else datos.get("subscription_id")
        institucion_id = db.execute(select(Suscripciones.__table__.c.institucion_id).where(
            Suscripciones.__table__.c.paddle_subscription_id == identificador
        )).scalar_one_or_none()
    if not institucion_id or db.get(Instituciones, institucion_id) is None:
        raise HTTPException(422, "No se pudo identificar la institucion del evento")
    db.info["institucion_id"] = institucion_id
    event_id = evento.get("event_id")
    ocurrido = _fecha(evento.get("occurred_at"))
    if not event_id or not ocurrido:
        raise HTTPException(422, "Evento de Paddle incompleto")
    suscripcion = db.query(Suscripciones).filter_by(institucion_id=institucion_id).with_for_update().one_or_none()
    if suscripcion is None:
        raise HTTPException(422, "La institucion no tiene suscripcion")
    if db.query(EventosPaddle).filter_by(event_id=event_id).first():
        return False
    if tipo == "subscription.created" and datos.get("transaction_id") != suscripcion.paddle_transaction_id:
        raise HTTPException(409, "La suscripcion no pertenece al checkout institucional")
    if tipo not in {"transaction.completed", "subscription.created"} and not suscripcion.paddle_subscription_id:
        raise HTTPException(409, "No existe una suscripcion de Paddle vinculada")
    if tipo.startswith("subscription.") and suscripcion.paddle_subscription_id and datos.get("id") != suscripcion.paddle_subscription_id:
        if tipo != "subscription.created" or suscripcion.estado not in {"CANCELADA", "SUSPENDIDA", "PRUEBA"}:
            raise HTTPException(409, "El evento no corresponde a la suscripcion institucional")
    if tipo == "transaction.completed":
        if not suscripcion.paddle_transaction_id and not suscripcion.paddle_subscription_id:
            raise HTTPException(409, "No existe un checkout institucional pendiente")
        if suscripcion.paddle_transaction_id and datos.get("id") != suscripcion.paddle_transaction_id:
            if datos.get("subscription_id") != suscripcion.paddle_subscription_id:
                raise HTTPException(409, "Transaccion ajena a la institucion")
        suscripcion.paddle_transaction_id = datos.get("id")
        suscripcion.paddle_customer_id = datos.get("customer_id") or suscripcion.paddle_customer_id
    elif not suscripcion.ultimo_evento_paddle_en or ocurrido > suscripcion.ultimo_evento_paddle_en:
        suscripcion.paddle_subscription_id = datos.get("id")
        suscripcion.paddle_customer_id = datos.get("customer_id") or suscripcion.paddle_customer_id
        items = datos.get("items") or []
        if items:
            precio = (items[0].get("price") or {}).get("id")
            if tipo == "subscription.created" and precio != suscripcion.paddle_price_id:
                raise HTTPException(409, "El precio no corresponde al plan institucional")
            suscripcion.paddle_price_id = precio or suscripcion.paddle_price_id
        estados = {"active": "ACTIVA", "trialing": "PRUEBA", "past_due": "ATRASADA", "canceled": "CANCELADA", "paused": "PAUSADA"}
        estado = datos.get("status")
        if estado in estados:
            suscripcion.estado = estados[estado]
            if tipo == "subscription.created":
                suscripcion.plan = "INSTITUCIONAL"
        periodo = datos.get("current_billing_period") or {}
        inicio = _fecha(periodo.get("starts_at"))
        fin = _fecha(periodo.get("ends_at"))
        if inicio and fin:
            suscripcion.periodo_actual_inicio = suscripcion.inicia_en = inicio
            suscripcion.periodo_actual_fin = suscripcion.vence_en = fin
        cambio = datos.get("scheduled_change") or {}
        suscripcion.cancelar_al_fin_periodo = cambio.get("action") == "cancel"
        suscripcion.ultimo_evento_paddle_en = ocurrido
    db.add(EventosPaddle(institucion_id=institucion_id, event_id=event_id, event_type=tipo, occurred_at=ocurrido))
    db.commit()
    return True
