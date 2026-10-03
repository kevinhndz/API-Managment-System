from fastapi import Depends, Header

from core.excepciones import AccesoProhibidoError
from utils.token import verificar_token


def el_vigilante(token: str = Header(...)) -> dict:
    return verificar_token(token)


def permiso_admin(json: dict = Depends(el_vigilante)) -> dict:
    if json["rol"] != "Admin":
        raise AccesoProhibidoError("No estas autorizado")
    return json


def permiso_usuario(json: dict = Depends(el_vigilante)) -> dict:
    if json["rol"] not in ["Docente", "Admin"]:
        raise AccesoProhibidoError("No estas autorizado")
    return json
