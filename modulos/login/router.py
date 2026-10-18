from pathlib import Path
import secrets
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from core.config import settings
from core.rate_limit_service import limitar_peticion_por_ip
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
    token = request.cookies.get("campusflow_csrf") or secrets.token_urlsafe(32)
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
    _establecer_cookie_csrf(response, request.cookies.get("campusflow_csrf") or secrets.token_urlsafe(32))
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
    registro = db.query(Usuarios).filter(Usuarios.id == usuario["user_id"]).first()
    return SesionUsuarioResponse(
        usuario=registro.usuario,
        nombre=registro.nombre,
        correo=registro.correo,
        rol=registro.rol,
        foto=registro.foto,
    )


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
    tipos = {
        "image/jpeg": (".jpg", (b"\xff\xd8\xff",)),
        "image/png": (".png", (b"\x89PNG\r\n\x1a\n",)),
        "image/webp": (".webp", (b"RIFF",)),
    }
    tipo = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if tipo not in tipos:
        raise HTTPException(status_code=415, detail="Usa una imagen JPG, PNG o WebP.")

    longitud = request.headers.get("content-length")
    if longitud:
        try:
            if int(longitud) > 5 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="La foto debe pesar hasta 5 MB.")
        except ValueError as error:
            raise HTTPException(status_code=400, detail="El tamaño del archivo no es válido.") from error
    partes = []
    bytes_recibidos = 0
    async for parte in request.stream():
        bytes_recibidos += len(parte)
        if bytes_recibidos > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="La foto debe pesar hasta 5 MB.")
        partes.append(parte)
    contenido = b"".join(partes)
    if not contenido:
        raise HTTPException(status_code=400, detail="El archivo de imagen está vacío.")
    extension, firmas = tipos[tipo]
    if not any(contenido.startswith(firma) for firma in firmas):
        raise HTTPException(status_code=415, detail="El archivo no coincide con el tipo de imagen indicado.")
    if tipo == "image/webp" and contenido[8:12] != b"WEBP":
        raise HTTPException(status_code=415, detail="El archivo WebP no es válido.")

    ruta_base = Path(settings.UPLOADS_DIR).resolve() / "profiles"
    foto_anterior = s.buscar_usuario_service(db, usuario["user_id"]).foto
    ruta_base.mkdir(parents=True, exist_ok=True)
    nombre_archivo = f"{uuid4().hex}{extension}"
    ruta_archivo = ruta_base / nombre_archivo
    ruta_archivo.write_bytes(contenido)
    foto_nueva = f"/uploads/profiles/{nombre_archivo}"
    try:
        registro = s.actualizar_foto_service(db, usuario["user_id"], foto_nueva)
    except Exception:
        ruta_archivo.unlink(missing_ok=True)
        raise
    if foto_anterior and foto_anterior.startswith("/uploads/profiles/"):
        (ruta_base / Path(foto_anterior).name).unlink(missing_ok=True)
    return PerfilUsuarioResponse(nombre=registro.nombre or registro.usuario, correo=registro.correo, foto=registro.foto)


@router.post("/recuperacion", response_model=SolicitarRecuperacionResponse, status_code=status.HTTP_202_ACCEPTED)
def solicitar_cambio_contrasena(
    json: SolicitarRecuperacion,
    request: Request,
    db: Session = Depends(abrir_puerta_bd),
):
    try:
        limitar_peticion_por_ip(
            db,
            "recuperacion-solicitud",
            request.client.host if request.client else "sin-ip",
            settings.RECOVERY_REQUEST_RATE_LIMIT_IP_ATTEMPTS,
            settings.RECOVERY_RATE_LIMIT_WINDOW_SECONDS,
        )
        solicitar_recuperacion(db, str(json.correo))
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"detail": "Si existe una cuenta con ese correo, recibira instrucciones."}


@router.post("/recuperacion/confirmar")
def confirmar_cambio_contrasena(
    json: RestablecerContrasena,
    request: Request,
    db: Session = Depends(abrir_puerta_bd),
):
    limitar_peticion_por_ip(
        db,
        "recuperacion-confirmacion",
        request.client.host if request.client else "sin-ip",
        settings.RECOVERY_CONFIRM_RATE_LIMIT_IP_ATTEMPTS,
        settings.RECOVERY_RATE_LIMIT_WINDOW_SECONDS,
    )
    confirmar_recuperacion(db, json.token, json.contrasena)
    return {"detail": "La contrasena se actualizo correctamente."}


@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(
    json: Revisar_Json_Crear_Usuario,
    db: Session = Depends(abrir_puerta_bd),
    admin: dict = Depends(permiso_admin),
):
    return s.crear_usuario_service(db, json)
