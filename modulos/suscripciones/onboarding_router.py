from fastapi import APIRouter, Request

from core.rate_limit_service import limitar_peticion_por_ip
from database.almacen import llaves
from modulos.suscripciones.paddle import detalles_planes
from modulos.suscripciones.onboarding import RegistroUniversidad, TokenAlta, estado_alta, reanudar_alta, registrar_universidad

router = APIRouter(prefix="/onboarding", tags=["Alta de universidad"])


@router.get("/planes")
def listar_planes():
    return detalles_planes()


@router.post("/universidades", status_code=201)
def crear_universidad(datos: RegistroUniversidad, request: Request):
    with llaves() as db:
        limitar_peticion_por_ip(db, "alta-institucion", request.client.host if request.client else "sin-ip", 5, 3600)
        return registrar_universidad(db, datos)


@router.post("/estado")
def consultar_estado(datos: TokenAlta):
    with llaves() as db:
        return estado_alta(db, datos.token)


@router.post("/reanudar")
def reanudar(datos: TokenAlta):
    with llaves() as db:
        return reanudar_alta(db, datos.token)
