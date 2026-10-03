from sqlalchemy.orm import Session
from modulos.reportes.repository import ReportesRepository as repo


class ReportesService:
    @staticmethod
    def reporte_matriculas_service(db: Session, periodo_id=None, estudiante_id=None):
        return repo.matriculas_repository(db, periodo_id, estudiante_id)

    @staticmethod
    def reporte_secciones_service(db: Session, periodo_id=None):
        return repo.secciones_repository(db, periodo_id)
