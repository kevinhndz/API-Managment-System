from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from core.excepciones import AccesoProhibidoError, CredencialesInvalidasError
from database.almacen import abrir_puerta_bd
from modulos.login.tabla import Usuarios
from utils.token import verificar_token


def el_vigilante(
    request: Request,
    authorization: str | None = Header(None, alias="Authorization"),
    db: Session = Depends(abrir_puerta_bd),
) -> dict:
    token = request.cookies.get("campusflow_session")
    if authorization:
        esquema, _, token_autorizacion = authorization.partition(" ")
        if esquema.lower() != "bearer" or not token_autorizacion:
            raise CredencialesInvalidasError("Formato de autorizacion invalido")
        token = token_autorizacion
    if not token:
        raise CredencialesInvalidasError("Autorizacion requerida")
    datos = verificar_token(token)
    usuario = db.query(Usuarios).filter(Usuarios.id == datos["user_id"]).first()
    if usuario is None or not usuario.activo:
        raise CredencialesInvalidasError("La cuenta no existe o esta desactivada")

    datos["user"] = usuario.usuario
    datos["rol"] = usuario.rol
    return datos


def permiso_admin(json: dict = Depends(el_vigilante)) -> dict:
    if json.get("rol", "").casefold() not in {"admin", "administrador"}:
        raise AccesoProhibidoError("No estas autorizado")
    return json


def permiso_usuario(json: dict = Depends(el_vigilante)) -> dict:
    if json["rol"] not in ["Docente", "Admin", "Administrador"]:
        raise AccesoProhibidoError("No estas autorizado")
    return json
