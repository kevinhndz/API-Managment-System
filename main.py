from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
from core.escuchadores import ExcepcionesGlobales as eg
from modulos.carreras.tabla import Carreras
from modulos.estudiantes.tabla import Estudiantes
from modulos.aulas.tabla import Aulas
from modulos.docentes.tabla import Docentes
from utils.auth import permiso_admin
from core.config import settings

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origen.strip()
        for origen in settings.FRONTEND_ORIGINS.split(",")
        if origen.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def contexto_auditoria(request, call_next):
    contexto = usuario_actual.set(
        identificar_usuario(
            request.headers.get("Authorization"),
            request.cookies.get("campusflow_session"),
        )
    )
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
app.include_router(router_reportes, dependencies=[Depends(permiso_admin)])
app.include_router(router_auditoria, dependencies=[Depends(permiso_admin)])
app.include_router(router_login)
app.include_router(router_solicitudes_cuenta)
eg.directorio(app)
