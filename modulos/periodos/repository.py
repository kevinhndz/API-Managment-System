from sqlalchemy.orm import Session

from modulos.periodos.tabla import Periodos


class PeriodoRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return db.query(Periodos).filter(
            (Periodos.anio == json.anio) & (Periodos.numero == json.numero)
        ).first()

    @staticmethod
    def guardar_periodo_repository(db: Session, periodo):
        db.add(periodo)
        db.commit()
        db.refresh(periodo)
        return periodo

    @staticmethod
    def listar_repository(db: Session, pagina_actual: int, limite: int):
        query = db.query(Periodos)
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

    @staticmethod
    def buscar_repository(db: Session, id):
        return db.query(Periodos).filter(Periodos.id == id).first()

    @staticmethod
    def eliminar_periodo_repository(db: Session, periodo):
        db.delete(periodo)
        db.commit()
