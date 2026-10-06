from fastapi import Depends, Header

from core.excepciones import AccesoProhibidoError
from utils.token import verificar_token


def el_vigilante(authorization: str | None = Header(None, alias="Authorization")) -> dict:
    if not authorization:
        raise AccesoProhibidoError("Autorizacion requerida")
    esquema, _, token = authorization.partition(" ")
    if esquema.lower() != "bearer" or not token:
        raise AccesoProhibidoError("Formato de autorizacion invalido")
    return verificar_token(token)


def permiso_admin(json: dict = Depends(el_vigilante)) -> dict:
    if json["rol"] not in ["Admin", "Administrador"]:
        raise AccesoProhibidoError("No estas autorizado")
    return json


def permiso_usuario(json: dict = Depends(el_vigilante)) -> dict:
    if json["rol"] not in ["Docente", "Admin", "Administrador"]:
        raise AccesoProhibidoError("No estas autorizado")
    return json
