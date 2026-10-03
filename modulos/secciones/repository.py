from sqlalchemy.orm import Session
from modulos.secciones.tabla import Secciones


class SeccionRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return db.query(Secciones).filter(Secciones.codigo == json.codigo).first()

    @staticmethod
    def guardar_seccion_repository(db: Session, seccion):
        db.add(seccion)
        db.commit()
        db.refresh(seccion)
        return seccion

    @staticmethod
    def listar_repository(db: Session, pagina_actual: int, limite: int):
        query = db.query(Secciones)
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

    @staticmethod
    def buscar_repository(db: Session, id):
        return db.query(Secciones).filter(Secciones.id == id).first()

    @staticmethod
    def eliminar_seccion_repository(db: Session, seccion):
        db.delete(seccion)
        db.commit()
