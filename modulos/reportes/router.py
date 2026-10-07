from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.almacen import abrir_puerta_bd
from modulos.reportes.service import ReportesService as s
from modulos.reportes.schema import ReporteMatriculaItem, ReporteSeccionItem
from modulos.reportes.repository import ReportesRepository as repo
from modulos.reportes.exportadores import exportar_excel, exportar_pdf
from modulos.auditoria.registro import registrar_evento

router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.get("/matriculas", response_model=list[ReporteMatriculaItem])
def reporte_matriculas(
    periodo_id: int | None = Query(None),
    estudiante_id: int | None = Query(None),
    estado: str | None = Query(None),
    carrera_id: int | None = Query(None),
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    db: Session = Depends(abrir_puerta_bd),
):
    return s.reporte_matriculas_service(db, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)


@router.get("/secciones", response_model=list[ReporteSeccionItem])
def reporte_secciones(
    periodo_id: int | None = Query(None),
    estado: str | None = Query(None),
    carrera_id: int | None = Query(None),
    db: Session = Depends(abrir_puerta_bd),
):
    return s.reporte_secciones_service(db, periodo_id, estado, carrera_id)


@router.get("/{modulo}/descargar/{formato}")
def descargar_reporte(
    modulo: Literal["matriculas", "secciones", "estudiantes", "docentes", "calificaciones"],
    formato: Literal["xlsx", "pdf"],
    periodo_id: int | None = None,
    estudiante_id: int | None = None,
    estado: str | None = None,
    carrera_id: int | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    db: Session = Depends(abrir_puerta_bd),
):
    if desde and hasta and desde > hasta:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="La fecha inicial no puede superar la fecha final")

    if modulo == "matriculas":
        registros = repo.matriculas_repository(db, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)
    elif modulo == "secciones":
        registros = repo.secciones_repository(db, periodo_id, estado, carrera_id)
    elif modulo == "estudiantes":
        registros = repo.estudiantes_repository(db, estado, carrera_id)
    elif modulo == "docentes":
        registros = repo.docentes_repository(db, estado)
    else:
        registros = repo.calificaciones_repository(db, periodo_id, carrera_id)

    respuesta = exportar_excel(modulo, registros) if formato == "xlsx" else exportar_pdf(modulo, registros)
    registrar_evento(db, "EXPORTAR", modulo, f"Descargo reporte {formato.upper()} de {modulo} con {len(registros)} registros")
    return respuesta
