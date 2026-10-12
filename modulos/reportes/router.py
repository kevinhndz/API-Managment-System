from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.almacen import abrir_puerta_bd
from modulos.reportes.service import ReportesService as s
from modulos.reportes.schema import ReporteMatriculaItem, ReporteSeccionItem, ReporteVistaPrevia
from modulos.reportes.exportadores import exportar_csv, exportar_excel, exportar_json, exportar_pdf
from modulos.auditoria.registro import registrar_evento
from utils.auth import permiso_admin, permiso_usuario

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
    administrador: dict = Depends(permiso_admin),
):
    return s.reporte_matriculas_service(db, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)


@router.get("/secciones", response_model=list[ReporteSeccionItem])
def reporte_secciones(
    periodo_id: int | None = Query(None),
    estado: str | None = Query(None),
    carrera_id: int | None = Query(None),
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return s.reporte_secciones_service(db, periodo_id, estado, carrera_id)


@router.get("/{modulo}/vista-previa", response_model=ReporteVistaPrevia)
def vista_previa_reporte(
    modulo: Literal["matriculas", "secciones", "estudiantes", "docentes", "calificaciones"],
    periodo_id: int | None = None,
    estudiante_id: int | None = None,
    estado: str | None = None,
    carrera_id: int | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    return s.vista_previa(db, modulo, usuario, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)


@router.get("/{modulo}/descargar/{formato}")
def descargar_reporte(
    modulo: Literal["matriculas", "secciones", "estudiantes", "docentes", "calificaciones"],
    formato: Literal["xlsx", "pdf", "csv", "json"],
    periodo_id: int | None = None,
    estudiante_id: int | None = None,
    estado: str | None = None,
    carrera_id: int | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    db: Session = Depends(abrir_puerta_bd),
    usuario: dict = Depends(permiso_usuario),
):
    registros = s.consultar_registros(db, modulo, usuario, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)

    if formato == "xlsx":
        respuesta = exportar_excel(modulo, registros)
    elif formato == "pdf":
        respuesta = exportar_pdf(modulo, registros)
    elif formato == "csv":
        respuesta = exportar_csv(modulo, registros)
    else:
        respuesta = exportar_json(modulo, registros)
    registrar_evento(db, "EXPORTAR", modulo, f"Descargo reporte {formato.upper()} de {modulo} con {len(registros)} registros")
    return respuesta
