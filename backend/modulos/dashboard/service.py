from sqlalchemy.orm import Session

from modulos.dashboard.repository import DashboardRepository as repo


class DashboardService:
    @staticmethod
    def resumen_service(db: Session) -> dict:
        return repo.resumen_repository(db)
