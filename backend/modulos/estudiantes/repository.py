from sqlalchemy.orm import Session

from modulos.estudiantes.tabla import Estudiantes


class EstudianteRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return db.query(Estudiantes).filter(Estudiantes.cuenta == json.cuenta).first()

    @staticmethod
    def guardar_estudiante_repository(db: Session, estudiante):
        db.add(estudiante)
        db.commit()
        db.refresh(estudiante)
        return estudiante

    @staticmethod
    def listar_repository(db: Session, pagina_actual: int, limite: int):
        query = db.query(Estudiantes)
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

    @staticmethod
    def buscar_repository(db: Session, id):
        return db.query(Estudiantes).filter(Estudiantes.id == id).first()

    @staticmethod
    def eliminar_estudiante_repository(db: Session, estudiante):
        db.delete(estudiante)
        db.commit()
