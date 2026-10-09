from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from core.config import settings
from database.almacen import abrir_puerta_bd
from utils.auth import permiso_admin, el_vigilante, permiso_usuario
from modulos.login.schema import LoginRequest, PerfilUsuarioActualizar, PerfilUsuarioResponse, Revisar_Json_Crear_Usuario, RestablecerContrasena, SesionResponse, SesionUsuarioResponse, SolicitarRecuperacion, SolicitarRecuperacionResponse, UsuarioResponse
from modulos.login.service import LoginService as s
from modulos.login.recuperacion import confirmar_recuperacion, solicitar_recuperacion
from modulos.login.tabla import Usuarios

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


@router.get("/actual", response_model=SesionUsuarioResponse)
def obtener_sesion_actual(
    usuario: dict = Depends(el_vigilante),
    db: Session = Depends(abrir_puerta_bd),
):
    registro = db.query(Usuarios).filter(Usuarios.id == usuario["user_id"]).first()
    return SesionUsuarioResponse(
        usuario=registro.usuario,
        nombre=registro.nombre,
        correo=registro.correo,
        rol=registro.rol,
    )


@router.patch("/perfil", response_model=PerfilUsuarioResponse)
def actualizar_perfil(
    json: PerfilUsuarioActualizar,
    usuario: dict = Depends(permiso_usuario),
    db: Session = Depends(abrir_puerta_bd),
):
    registro = s.actualizar_perfil_service(db, usuario["user_id"], json)
    return PerfilUsuarioResponse(nombre=registro.nombre, correo=registro.correo)


@router.post("/recuperacion", response_model=SolicitarRecuperacionResponse, status_code=status.HTTP_202_ACCEPTED)
def solicitar_cambio_contrasena(
    json: SolicitarRecuperacion,
    db: Session = Depends(abrir_puerta_bd),
):
    try:
        solicitar_recuperacion(db, str(json.correo))
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"detail": "Si existe una cuenta con ese correo, recibira instrucciones."}


@router.post("/recuperacion/confirmar")
def confirmar_cambio_contrasena(
    json: RestablecerContrasena,
    db: Session = Depends(abrir_puerta_bd),
):
    confirmar_recuperacion(db, json.token, json.contrasena)
    return {"detail": "La contrasena se actualizo correctamente."}


@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(
    json: Revisar_Json_Crear_Usuario,
    db: Session = Depends(abrir_puerta_bd),
    admin: dict = Depends(permiso_admin),
):
    return s.crear_usuario_service(db, json)
