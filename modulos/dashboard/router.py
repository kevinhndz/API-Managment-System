from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.dashboard.schema import DashboardResumen
from modulos.dashboard.service import DashboardService as s
from utils.auth import permiso_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumen", response_model=DashboardResumen)
def obtener_resumen_dashboard(
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return s.resumen_service(db)
