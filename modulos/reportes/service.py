from sqlalchemy.orm import Session
from modulos.reportes.repository import ReportesRepository as repo
from modulos.reportes.exportadores import COLUMNAS, valor_json
from core.excepciones import AccesoProhibidoError
from fastapi import HTTPException


class ReportesService:
    @staticmethod
    def consultar_registros(db: Session, modulo: str, usuario: dict, periodo_id=None, estudiante_id=None, estado=None, carrera_id=None, desde=None, hasta=None):
        es_docente = usuario["rol"].casefold() == "docente"
        if es_docente and modulo != "calificaciones":
            raise AccesoProhibidoError("Los docentes solo pueden consultar reportes de sus calificaciones")
        if desde and hasta and desde > hasta:
            raise HTTPException(status_code=422, detail="La fecha inicial no puede superar la fecha final")

        if modulo == "matriculas":
            return repo.matriculas_repository(db, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)
        if modulo == "secciones":
            return repo.secciones_repository(db, periodo_id, estado, carrera_id)
        if modulo == "estudiantes":
            return repo.estudiantes_repository(db, estado, carrera_id)
        if modulo == "docentes":
            return repo.docentes_repository(db, estado)
        docente_id = usuario["docente_id"] if es_docente else None
        return repo.calificaciones_repository(db, periodo_id, carrera_id, docente_id)

    @staticmethod
    def vista_previa(db: Session, modulo: str, usuario: dict, periodo_id=None, estudiante_id=None, estado=None, carrera_id=None, desde=None, hasta=None):
        registros = ReportesService.consultar_registros(db, modulo, usuario, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)
        columnas = COLUMNAS[modulo]
        return {
            "modulo": modulo,
            "total_registros": len(registros),
            "columnas": [{"titulo": titulo, "campo": campo} for titulo, campo in columnas],
            "registros": [
                {campo: valor_json(item, campo) for _, campo in columnas}
                for item in registros[:20]
            ],
        }

    @staticmethod
    def reporte_matriculas_service(db: Session, periodo_id=None, estudiante_id=None, estado=None, carrera_id=None, desde=None, hasta=None):
        return repo.matriculas_repository(db, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)

    @staticmethod
    def reporte_secciones_service(db: Session, periodo_id=None, estado=None, carrera_id=None):
        return repo.secciones_repository(db, periodo_id, estado, carrera_id)
