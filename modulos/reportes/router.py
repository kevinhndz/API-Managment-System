from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.almacen import abrir_puerta_bd
from modulos.reportes.service import ReportesService as s
from modulos.reportes.schema import ReporteMatriculaItem, ReporteSeccionItem

router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.get("/matriculas", response_model=list[ReporteMatriculaItem])
def reporte_matriculas(
    periodo_id: int | None = Query(None),
    estudiante_id: int | None = Query(None),
    db: Session = Depends(abrir_puerta_bd),
):
    return s.reporte_matriculas_service(db, periodo_id, estudiante_id)


@router.get("/secciones", response_model=list[ReporteSeccionItem])
def reporte_secciones(
    periodo_id: int | None = Query(None), db: Session = Depends(abrir_puerta_bd)
):
    return s.reporte_secciones_service(db, periodo_id)
