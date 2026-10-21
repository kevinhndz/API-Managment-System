from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from core.excepciones import AccesoProhibidoError, CredencialesInvalidasError
from database.almacen import abrir_puerta_bd
from modulos.login.repository import UsuarioRepository
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
    if datos.get("institucion_id") != db.info.get("institucion_id"):
        raise CredencialesInvalidasError("La sesion no corresponde a esta institución")
    usuario = UsuarioRepository.buscar_por_id_repository(db, datos["user_id"])
    if (
        usuario is None
        or not usuario.activo
        or datos.get("version_token", 0) != usuario.version_token
        or usuario.institucion_id != datos.get("institucion_id")
    ):
        raise CredencialesInvalidasError("La cuenta no existe o esta desactivada")

    datos["user"] = usuario.usuario
    datos["rol"] = usuario.rol
    datos["docente_id"] = usuario.docente_id
    return datos


def permiso_admin(json: dict = Depends(el_vigilante)) -> dict:
    if json.get("rol", "").casefold() not in {"admin", "administrador"}:
        raise AccesoProhibidoError("No estas autorizado")
    return json


def permiso_usuario(json: dict = Depends(el_vigilante)) -> dict:
    if json.get("rol", "").casefold() not in {"docente", "admin", "administrador"}:
        raise AccesoProhibidoError("No estas autorizado")
    if json.get("rol", "").casefold() == "docente" and json.get("docente_id") is None:
        raise AccesoProhibidoError("La cuenta docente no esta vinculada a un registro institucional")
    return json


def alcance_docente(usuario: dict = Depends(permiso_usuario)) -> int | None:
    if usuario["rol"].casefold() in {"admin", "administrador"}:
        return None
    return usuario["docente_id"]
