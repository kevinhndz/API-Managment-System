from fastapi import FastAPI
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

app = FastAPI()

app.include_router(router_aulas)
app.include_router(router_docentes)
app.include_router(router_carreras)
app.include_router(router_estudiantes)
app.include_router(router_asignaturas)
app.include_router(router_periodos)
app.include_router(router_secciones)
app.include_router(router_matriculas)
app.include_router(router_calificaciones)
app.include_router(router_reportes)
app.include_router(router_login)
eg.directorio(app)
