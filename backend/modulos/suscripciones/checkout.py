"""Checkout para instituciones existentes, sin alterar su acceso antes del webhook."""

from datetime import datetime, timedelta, timezone
import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

from core.config import settings
from database.almacen import Instituciones
from modulos.suscripciones import paddle
from modulos.suscripciones.catalogo import planes_disponibles
from modulos.suscripciones.tabla import Suscripciones


def iniciar_checkout(db: Session, nombre_plan: str) -> dict:
    if not settings.PADDLE_CLIENT_TOKEN or not settings.PADDLE_WEBHOOK_SECRET.get_secret_value():
        raise HTTPException(503, "El pago no esta disponible: falta configurar Paddle Checkout o su webhook")
    prefijo = 'test' if settings.PADDLE_ENVIRONMENT == 'sandbox' else 'live'
    if not re.fullmatch(rf'{prefijo}_[A-Za-z0-9]{{27}}', settings.PADDLE_CLIENT_TOKEN):
        raise HTTPException(503, "El token publico de Paddle Checkout no es valido para el entorno configurado")
    precio = next((plan['price_id'] for plan in planes_disponibles() if plan['nombre'] == nombre_plan), None)
    if not precio:
        raise HTTPException(422, "Selecciona un plan disponible")

    try:
        # Serializa los clics de todos los administradores de esta institucion.
        institucion = db.query(Instituciones).filter_by(id=db.info['institucion_id']).with_for_update().one()
        suscripcion = db.query(Suscripciones).filter_by(institucion_id=institucion.id).with_for_update().one_or_none()
        if suscripcion and suscripcion.paddle_subscription_id and suscripcion.estado != 'CANCELADA':
            raise HTTPException(409, "La institucion ya tiene una suscripcion. Administra su pago sin crear otra")

        transaccion_id = None
        if suscripcion and suscripcion.paddle_transaction_id:
            anterior = paddle._api('GET', f'/transactions/{suscripcion.paddle_transaction_id}')
            if anterior.get('status') in {'draft', 'ready'}:
                if suscripcion.paddle_price_id != precio:
                    raise HTTPException(409, "Ya hay un pago pendiente para otro plan. Continua ese pago")
                transaccion_id = anterior['id']
            elif anterior.get('status') != 'canceled' and not (
                suscripcion.estado == 'CANCELADA' and suscripcion.paddle_subscription_id
                and anterior.get('subscription_id') == suscripcion.paddle_subscription_id
            ):
                raise HTTPException(409, "El pago ya esta en proceso. Espera su confirmacion y actualiza la suscripcion")

        if transaccion_id is None:
            detalle = paddle._api('GET', f'/prices/{precio}')
            ciclo = detalle.get('billing_cycle') or {}
            if detalle.get('status') != 'active' or ciclo.get('interval') != 'month' or ciclo.get('frequency') != 1:
                raise HTTPException(422, "El plan debe tener un precio mensual activo")
            if suscripcion is None:
                ahora = datetime.now(timezone.utc)
                suscripcion = Suscripciones(institucion_id=institucion.id, plan=nombre_plan,
                    estado='PENDIENTE', inicia_en=ahora, vence_en=ahora + timedelta(days=7))
                db.add(suscripcion)
                db.flush()
            transaccion_id = paddle.crear_transaccion_inicial(institucion.id, precio)
            suscripcion.paddle_transaction_id = transaccion_id
            suscripcion.paddle_price_id = precio
            suscripcion.plan = nombre_plan
        db.commit()
        return {'transaction_id': transaccion_id, 'client_token': settings.PADDLE_CLIENT_TOKEN,
                'environment': settings.PADDLE_ENVIRONMENT}
    except Exception:
        db.rollback()
        raise
