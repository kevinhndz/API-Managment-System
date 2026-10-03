from fastapi import FastAPI
from modulos.aulas.router import router as router_aulas
from modulos.carreras.router import router as router_carreras
from modulos.docentes.router import router as router_docentes
from modulos.estudiantes.router import router as router_estudiantes
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
eg.directorio(app)
