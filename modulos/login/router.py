from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session
from core.config import settings
from database.almacen import abrir_puerta_bd
from utils.auth import permiso_admin, el_vigilante, permiso_usuario
from modulos.login.schema import LoginRequest, PerfilUsuarioActualizar, PerfilUsuarioResponse, Revisar_Json_Crear_Usuario, RestablecerContrasena, SesionResponse, SesionUsuarioResponse, SolicitarRecuperacion, SolicitarRecuperacionResponse, UsuarioResponse
from modulos.login.service import LoginService as s
from modulos.login.foto_service import actualizar_foto_perfil as guardar_foto

router = APIRouter(prefix="/login", tags=["Login"])


def _establecer_cookie_sesion(response: Response, token: str) -> None:
    response.set_cookie(
        key="campusflow_session",
        value=token,
        max_age=30 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )


def _establecer_cookie_csrf(response: Response, token: str) -> None:
    response.set_cookie(
        key="campusflow_csrf",
        value=token,
        max_age=30 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )


@router.get("/csrf")
def obtener_token_csrf(request: Request, response: Response):
    token = s.preparar_token_csrf(request.cookies.get("campusflow_csrf"))
    _establecer_cookie_csrf(response, token)
    response.headers["Cache-Control"] = "no-store"
    return {"csrf_token": token}


@router.post("/sesion", response_model=SesionResponse)
def iniciar_sesion_web(
    json: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(abrir_puerta_bd),
):
    direccion_ip = request.client.host if request.client else None
    token = s.login_service(db, json, direccion_ip)
    _establecer_cookie_sesion(response, token)
    _establecer_cookie_csrf(response, s.preparar_token_csrf(request.cookies.get("campusflow_csrf")))
    return SesionResponse()


@router.post("/cerrar", status_code=status.HTTP_204_NO_CONTENT)
def cerrar_sesion(response: Response):
    response.delete_cookie(
        key="campusflow_session",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    response.delete_cookie(
        key="campusflow_csrf",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )


@router.get("/actual", response_model=SesionUsuarioResponse)
def obtener_sesion_actual(
    usuario: dict = Depends(el_vigilante),
    db: Session = Depends(abrir_puerta_bd),
):
    return s.obtener_sesion_actual_service(db, usuario["user_id"])


@router.patch("/perfil", response_model=PerfilUsuarioResponse)
def actualizar_perfil(
    json: PerfilUsuarioActualizar,
    usuario: dict = Depends(permiso_usuario),
    db: Session = Depends(abrir_puerta_bd),
):
    registro = s.actualizar_perfil_service(db, usuario["user_id"], json)
    return PerfilUsuarioResponse(nombre=registro.nombre or registro.usuario, correo=registro.correo, foto=registro.foto)


@router.put("/perfil/foto", response_model=PerfilUsuarioResponse)
async def actualizar_foto_perfil(
    request: Request,
    usuario: dict = Depends(permiso_usuario),
    db: Session = Depends(abrir_puerta_bd),
):
    return await guardar_foto(
        db, usuario["user_id"], request.headers.get("content-type", ""),
        request.headers.get("content-length"), request.stream(),
    )


@router.post("/recuperacion", response_model=SolicitarRecuperacionResponse, status_code=status.HTTP_202_ACCEPTED)
def solicitar_cambio_contrasena(
    json: SolicitarRecuperacion,
    request: Request,
    db: Session = Depends(abrir_puerta_bd),
):
    s.solicitar_recuperacion_service(
        db, str(json.correo), request.client.host if request.client else "sin-ip"
    )
    return {"detail": "Si existe una cuenta con ese correo, recibira instrucciones."}


@router.post("/recuperacion/confirmar")
def confirmar_cambio_contrasena(
    json: RestablecerContrasena,
    request: Request,
    db: Session = Depends(abrir_puerta_bd),
):
    s.confirmar_recuperacion_service(
        db, json.token, json.contrasena,
        request.client.host if request.client else "sin-ip",
    )
    return {"detail": "La contrasena se actualizo correctamente."}


@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(
    json: Revisar_Json_Crear_Usuario,
    db: Session = Depends(abrir_puerta_bd),
    admin: dict = Depends(permiso_admin),
):
    return s.crear_usuario_service(db, json)
