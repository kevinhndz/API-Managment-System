from pathlib import Path
import hmac
import re

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from database.almacen import abrir_puerta_bd
from modulos.notificaciones.router import router as router_notificaciones
from modulos.aulas.router import router as router_aulas
from modulos.carreras.router import router as router_carreras
from modulos.docentes.router import router as router_docentes
from modulos.estudiantes.router import router as router_estudiantes
from modulos.asignaturas.router import router as router_asignaturas
from modulos.periodos.router import router as router_periodos
from modulos.secciones.router import router as router_secciones
from modulos.matriculas.router import router as router_matriculas
from modulos.calificaciones.router import router as router_calificaciones
from modulos.reportes.router import router as router_reportes
from modulos.login.router import router as router_login
from modulos.login.tabla import Usuarios
from modulos.auditoria.router import router as router_auditoria
from modulos.auditoria.registro import identificar_usuario, usuario_actual
from modulos.solicitudes_cuenta.router import router as router_solicitudes_cuenta
from modulos.dashboard.router import router as router_dashboard
from modulos.suscripciones.router import router as router_suscripcion
from modulos.suscripciones.payments_router import router as router_payments
from modulos.suscripciones.dependencias import exigir_suscripcion
from modulos.documentos.router import router as router_documentos
from modulos.finanzas.router import router as router_finanzas
from core.escuchadores import ExcepcionesGlobales as eg
from modulos.carreras.tabla import Carreras
from modulos.estudiantes.tabla import Estudiantes
from modulos.aulas.tabla import Aulas
from modulos.docentes.tabla import Docentes
from utils.auth import permiso_admin, permiso_usuario
from core.config import settings

app = FastAPI()
Path(settings.UPLOADS_DIR).mkdir(parents=True, exist_ok=True)


@app.get("/uploads/profiles/{nombre}")
def servir_foto_perfil(
    nombre: str,
    usuario: dict = Depends(permiso_usuario),
    db: Session = Depends(abrir_puerta_bd),
):
    if not re.fullmatch(r"[0-9a-f]{32}\.(?:jpg|png|webp)", nombre):
        return JSONResponse(status_code=404, content={"detail": "Foto no encontrada"})
    cuenta = db.query(Usuarios).filter(Usuarios.id == usuario["user_id"]).first()
    if cuenta is None or cuenta.foto != f"/uploads/profiles/{nombre}":
        return JSONResponse(status_code=404, content={"detail": "Foto no encontrada"})
    archivo = Path(settings.UPLOADS_DIR).resolve() / "profiles" / nombre
    if not archivo.is_file():
        return JSONResponse(status_code=404, content={"detail": "Foto no encontrada"})
    return FileResponse(archivo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origen.strip()
        for origen in settings.FRONTEND_ORIGINS.split(",")
        if origen.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization", "Content-Type", "X-CSRF-Token", "X-Institution-Slug"
    ],
)


@app.middleware("http")
async def proteger_cambios_con_cookie(request, call_next):
    metodos_que_cambian_datos = {"POST", "PUT", "PATCH", "DELETE"}
    usa_cookie = bool(request.cookies.get("campusflow_session"))
    usa_token_bearer = request.headers.get("Authorization", "").lower().startswith("bearer ")
    if request.method in metodos_que_cambian_datos:
        if request.url.path in {"/payments/paddle/webhook", "/api/payments/paddle/webhook"}:
            return await call_next(request)
        origen = request.headers.get("origin")
        origenes_permitidos = {
            valor.strip().rstrip("/")
            for valor in settings.FRONTEND_ORIGINS.split(",")
            if valor.strip()
        }
        if origen and origen.rstrip("/") not in origenes_permitidos:
            return JSONResponse(status_code=403, content={"detail": "Origen no permitido."})

        requiere_token = (usa_cookie and not usa_token_bearer) or bool(origen)
        if requiere_token:
            token_cookie = request.cookies.get("campusflow_csrf", "")
            token_encabezado = request.headers.get("X-CSRF-Token", "")
            if not token_cookie or not token_encabezado or not hmac.compare_digest(token_cookie, token_encabezado):
                return JSONResponse(status_code=403, content={"detail": "La solicitud de seguridad vencio. Recarga e intenta de nuevo."})
    return await call_next(request)


@app.middleware("http")
async def contexto_auditoria(request, call_next):
    usuario = identificar_usuario(
        request.headers.get("Authorization"),
        request.cookies.get("campusflow_session"),
    )
    if usuario is not None:
        usuario = {**usuario, "ip_origen": request.client.host if request.client else None}
    contexto = usuario_actual.set(usuario)
    try:
        return await call_next(request)
    finally:
        usuario_actual.reset(contexto)

app.include_router(router_aulas, dependencies=[Depends(permiso_admin)])
app.include_router(router_docentes, dependencies=[Depends(permiso_admin)])
app.include_router(router_carreras)
app.include_router(router_estudiantes)
app.include_router(router_asignaturas, dependencies=[Depends(permiso_admin)])
app.include_router(router_periodos, dependencies=[Depends(permiso_admin)])
app.include_router(router_secciones, dependencies=[Depends(permiso_admin)])
app.include_router(router_matriculas)
app.include_router(router_calificaciones)
app.include_router(router_reportes, dependencies=[Depends(exigir_suscripcion)])
app.include_router(router_auditoria, dependencies=[Depends(permiso_admin), Depends(exigir_suscripcion)])
app.include_router(router_login)
app.include_router(router_notificaciones)
app.include_router(router_solicitudes_cuenta)
app.include_router(router_dashboard)
app.include_router(router_suscripcion)
app.include_router(router_payments, include_in_schema=False)
app.include_router(router_payments, prefix="/api")
app.include_router(router_documentos)
app.include_router(router_finanzas)
eg.directorio(app)
