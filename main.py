from fastapi import FastAPI
from modulos.aulas.router import router as router_aulas
from modulos.carreras.router import router as router_carreras
from modulos.docentes.router import router as router_docentes
from core.escuchadores import ExcepcionesGlobales as eg

app = FastAPI()

app.include_router(router_aulas)
app.include_router(router_docentes)
app.include_router(router_carreras)
eg.directorio(app)
