"""Catalogo de planes permitidos para Paddle."""

import json

from core.config import settings


def planes_disponibles() -> list[dict[str, str]]:
    if settings.PADDLE_PLANS:
        try:
            configurados = json.loads(settings.PADDLE_PLANS)
            if not isinstance(configurados, dict):
                raise ValueError("Planes invalidos")
            planes = [{"nombre": nombre, "price_id": precio} for nombre, precio in configurados.items()
                     if isinstance(nombre, str) and 1 <= len(nombre) <= 40 and isinstance(precio, str) and precio.startswith("pri_")]
            if planes:
                return planes
        except ValueError:
            pass
    return [{"nombre": "Institucional", "price_id": settings.PADDLE_PRICE_ID}] if settings.PADDLE_PRICE_ID else []
