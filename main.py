from fastapi import Depends, FastAPI
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
from core.escuchadores import ExcepcionesGlobales as eg
from modulos.carreras.tabla import Carreras
from modulos.estudiantes.tabla import Estudiantes
from modulos.aulas.tabla import Aulas
from modulos.docentes.tabla import Docentes
from utils.auth import permiso_admin

app = FastAPI()

app.include_router(router_aulas, dependencies=[Depends(permiso_admin)])
app.include_router(router_docentes, dependencies=[Depends(permiso_admin)])
app.include_router(router_carreras, dependencies=[Depends(permiso_admin)])
app.include_router(router_estudiantes, dependencies=[Depends(permiso_admin)])
app.include_router(router_asignaturas, dependencies=[Depends(permiso_admin)])
app.include_router(router_periodos, dependencies=[Depends(permiso_admin)])
app.include_router(router_secciones, dependencies=[Depends(permiso_admin)])
app.include_router(router_matriculas, dependencies=[Depends(permiso_admin)])
app.include_router(router_calificaciones, dependencies=[Depends(permiso_admin)])
app.include_router(router_reportes, dependencies=[Depends(permiso_admin)])
app.include_router(router_login)
eg.directorio(app)
