from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.almacen import abrir_puerta_bd
from utils.auth import permiso_admin
from modulos.login.schema import *
from modulos.login.service import LoginService as s

router = APIRouter(prefix="/login", tags=["Login"])


@router.post("/", response_model=TokenResponse)
def iniciar_sesion(json: LoginRequest, db: Session = Depends(abrir_puerta_bd)):
    return TokenResponse(token=s.login_service(db, json))


@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(
    json: Revisar_Json_Crear_Usuario,
    db: Session = Depends(abrir_puerta_bd),
    admin: dict = Depends(permiso_admin),
):
    return s.crear_usuario_service(db, json)
