from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from database.almacen import Instituciones, motor

router = APIRouter()


@router.get("/health/ready", include_in_schema=False)
def comprobar_disponibilidad():
    # Comprueba la misma tabla que necesita el acceso, sin exponer datos.
    try:
        with motor.connect() as conexion:
            conexion.execute(select(Instituciones.id).limit(1))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=503,
            content={"detail": "La base de datos no esta disponible."},
            headers={"Cache-Control": "no-store"},
        )
    return JSONResponse(content={"status": "ok"}, headers={"Cache-Control": "no-store"})
