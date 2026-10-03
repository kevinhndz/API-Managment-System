from sqlalchemy.orm import Session

from modulos.docentes.tabla import Docentes


class DocenteRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return db.query(Docentes).filter(
            (Docentes.numero_empleado == json.numero_empleado)
            | (Docentes.correo == json.correo)
        ).first()

    @staticmethod
    def listar_repository(db: Session):
        return db.query(Docentes).all()

    @staticmethod
    def buscar_repository(db: Session, id):
        return db.query(Docentes).filter(Docentes.id == id).first()

    @staticmethod
    def guardar_docente_repository(db: Session, nueva_docente):
        db.add(nueva_docente)
        db.commit()
        db.refresh(nueva_docente)
        return nueva_docente

    @staticmethod
    def eliminar_docente_repository(db: Session, docente):
        db.delete(docente)
        db.commit()
