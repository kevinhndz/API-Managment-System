from sqlalchemy.orm import Session
from modulos.calificaciones.tabla import Calificaciones


class CalificacionRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return (
            db.query(Calificaciones)
            .filter(Calificaciones.matricula_id == json.matricula_id)
            .first()
        )

    @staticmethod
    def guardar_calificacion_repository(db: Session, calificacion):
        db.add(calificacion)
        db.commit()
        db.refresh(calificacion)
        return calificacion

    @staticmethod
    def listar_repository(db: Session, pagina_actual: int, limite: int):
        query = db.query(Calificaciones)
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

    @staticmethod
    def buscar_repository(db: Session, id):
        return db.query(Calificaciones).filter(Calificaciones.id == id).first()

    @staticmethod
    def eliminar_calificacion_repository(db: Session, calificacion):
        db.delete(calificacion)
        db.commit()
