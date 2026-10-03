from fastapi import FastAPI
from modulos.aulas.router import router as router_aulas
from core.escuchadores import ExcepcionesGlobales as eg

app = FastAPI()

app.include_router(router_aulas)
eg.directorio(app)