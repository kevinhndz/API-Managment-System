"""Alta publica de una universidad y su primer administrador."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.config import settings
from database.almacen import Instituciones
from modulos.login.tabla import Usuarios
from modulos.suscripciones.catalogo import planes_disponibles
from modulos.suscripciones.paddle import crear_transaccion_inicial, detalles_planes
from modulos.suscripciones.tabla import AltasInstitucion, Suscripciones
from utils.hash import encriptar_contrasena


class RegistroUniversidad(BaseModel):
    slug: str = Field(min_length=3, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    nombre_institucion: str = Field(min_length=3, max_length=200)
    nombre_administrador: str = Field(min_length=3, max_length=160)
    correo_administrador: EmailStr
    usuario_administrador: str = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9._-]+$")
    contrasena: str = Field(min_length=12, max_length=72)
    plan: str = Field(min_length=1, max_length=40)

    @field_validator("nombre_institucion", "nombre_administrador")
    @classmethod
    def limpiar_nombre(cls, valor: str) -> str:
        limpio = valor.strip()
        if len(limpio) < 3:
            raise ValueError("El nombre debe tener al menos tres caracteres")
        return limpio


class TokenAlta(BaseModel):
    token: str = Field(min_length=32, max_length=128)


def _respuesta_alta(suscripcion: Suscripciones, token: str, slug: str) -> dict:
    return {"slug": slug, "token": token, "transaction_id": suscripcion.paddle_transaction_id,
            "client_token": settings.PADDLE_CLIENT_TOKEN, "environment": settings.PADDLE_ENVIRONMENT,
            "status": suscripcion.estado}


def registrar_universidad(db: Session, datos: RegistroUniversidad) -> dict:
    if not settings.PADDLE_CLIENT_TOKEN:
        raise HTTPException(503, "El registro esta temporalmente deshabilitado: falta configurar Paddle Checkout")
    if not settings.PADDLE_WEBHOOK_SECRET.get_secret_value():
        raise HTTPException(503, "El registro esta temporalmente deshabilitado: falta configurar el webhook de Paddle")
    planes = {plan["nombre"]: plan["price_id"] for plan in planes_disponibles()}
    precio = planes.get(datos.plan)
    if not precio:
        raise HTTPException(503, "El plan seleccionado no tiene un precio valido de Paddle Sandbox")
    if not any(plan["nombre"] == datos.plan and plan["disponible"] for plan in detalles_planes()):
        raise HTTPException(503, "El plan seleccionado no esta disponible en Paddle Sandbox")
    if db.query(Instituciones.id).filter(Instituciones.slug == datos.slug).first():
        raise HTTPException(409, "Ya existe una universidad con ese identificador")

    ahora = datetime.now(timezone.utc)
    token = secrets.token_urlsafe(32)
    try:
        institucion = Instituciones(slug=datos.slug, nombre=datos.nombre_institucion, activa=False)
        db.add(institucion)
        db.flush()
        db.info["institucion_id"] = institucion.id
        usuario = Usuarios(institucion_id=institucion.id, usuario=datos.usuario_administrador,
            nombre=datos.nombre_administrador, correo=str(datos.correo_administrador).casefold(),
            contrasena=encriptar_contrasena(datos.contrasena), rol="Administrador", propietario=True, activo=True)
        suscripcion = Suscripciones(institucion_id=institucion.id, plan=datos.plan, estado="PENDIENTE",
            inicia_en=ahora, vence_en=ahora + timedelta(days=7), paddle_price_id=precio)
        alta = AltasInstitucion(institucion_id=institucion.id,
            token_hash=hashlib.sha256(token.encode()).hexdigest(), vence_en=ahora + timedelta(days=7))
        db.add_all([usuario, suscripcion, alta])
        db.flush()
        suscripcion.paddle_transaction_id = crear_transaccion_inicial(institucion.id, precio)
        db.commit()
        return _respuesta_alta(suscripcion, token, institucion.slug)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "Los datos de la universidad ya estan registrados") from exc
    except Exception:
        db.rollback()
        raise


def consultar_alta(db: Session, token: str) -> tuple[Instituciones, Suscripciones, AltasInstitucion]:
    hash_token = hashlib.sha256(token.encode()).hexdigest()
    alta = db.query(AltasInstitucion.__table__).filter_by(token_hash=hash_token).first()
    if alta is None:
        raise HTTPException(404, "Alta no encontrada")
    institucion = db.get(Instituciones, alta.institucion_id)
    if institucion is None:
        raise HTTPException(404, "Universidad no encontrada")
    db.info["institucion_id"] = institucion.id
    suscripcion = db.query(Suscripciones).filter_by(institucion_id=institucion.id).one()
    return institucion, suscripcion, alta


def estado_alta(db: Session, token: str) -> dict:
    institucion, suscripcion, _ = consultar_alta(db, token)
    return {"slug": institucion.slug, "status": suscripcion.estado, "active": institucion.activa and suscripcion.estado == "ACTIVA"}


def reanudar_alta(db: Session, token: str) -> dict:
    institucion, suscripcion, alta = consultar_alta(db, token)
    vencimiento = alta.vence_en if alta.vence_en.tzinfo else alta.vence_en.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) >= vencimiento:
        raise HTTPException(410, "El enlace de registro vencio")
    if institucion.activa or suscripcion.estado != "PENDIENTE":
        raise HTTPException(409, "El registro ya termino")
    if not suscripcion.paddle_transaction_id:
        raise HTTPException(409, "No hay un checkout pendiente")
    return _respuesta_alta(suscripcion, token, institucion.slug)
