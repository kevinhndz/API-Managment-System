from sqlalchemy.orm import Session

from modulos.carreras.tabla import Carreras


class CarreraRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return db.query(Carreras).filter(
            (Carreras.codigo == json.codigo) | (Carreras.nombre == json.nombre)
        ).first()

    @staticmethod
    def listar_repository(db: Session):
        return db.query(Carreras).all()

    @staticmethod
    def buscar_repository(db: Session, id):
        return db.query(Carreras).filter(Carreras.id == id).first()

    @staticmethod
    def guardar_carrera_repository(db: Session, nueva_carrera):
        db.add(nueva_carrera)
        db.commit()
        db.refresh(nueva_carrera)
        return nueva_carrera

    @staticmethod
    def eliminar_carrera_repository(db: Session, carrera):
        db.delete(carrera)
        db.commit()
