from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from core.config import settings
from database.almacen import abrir_puerta_bd
from utils.auth import permiso_admin
from modulos.login.schema import LoginRequest, Revisar_Json_Crear_Usuario, SesionResponse, TokenResponse, UsuarioResponse
from modulos.login.service import LoginService as s

router = APIRouter(prefix="/login", tags=["Login"])


def _establecer_cookie_sesion(response: Response, token: str) -> None:
    response.set_cookie(
        key="campusflow_session",
        value=token,
        max_age=30 * 60,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


@router.post("/", response_model=TokenResponse)
def iniciar_sesion(
    json: LoginRequest,
    response: Response,
    db: Session = Depends(abrir_puerta_bd),
):
    token = s.login_service(db, json)
    _establecer_cookie_sesion(response, token)
    return TokenResponse(token=token)


@router.post("/sesion", response_model=SesionResponse)
def iniciar_sesion_web(
    json: LoginRequest,
    response: Response,
    db: Session = Depends(abrir_puerta_bd),
):
    token = s.login_service(db, json)
    _establecer_cookie_sesion(response, token)
    return SesionResponse()


@router.post("/cerrar", status_code=status.HTTP_204_NO_CONTENT)
def cerrar_sesion(response: Response):
    response.delete_cookie(
        key="campusflow_session",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(
    json: Revisar_Json_Crear_Usuario,
    db: Session = Depends(abrir_puerta_bd),
    admin: dict = Depends(permiso_admin),
):
    return s.crear_usuario_service(db, json)
