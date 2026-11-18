from sqlalchemy.orm import Session

from modulos.asignaturas.tabla import Asignaturas


class AsignaturaRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return db.query(Asignaturas).filter(Asignaturas.codigo == json.codigo).first()

    @staticmethod
    def guardar_asignatura_repository(db: Session, asignatura):
        db.add(asignatura)
        db.commit()
        db.refresh(asignatura)
        return asignatura

    @staticmethod
    def listar_repository(db: Session, pagina_actual: int, limite: int):
        query = db.query(Asignaturas)
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

    @staticmethod
    def buscar_repository(db: Session, id):
        return db.query(Asignaturas).filter(Asignaturas.id == id).first()

    @staticmethod
    def eliminar_asignatura_repository(db: Session, asignatura):
        db.delete(asignatura)
        db.commit()
