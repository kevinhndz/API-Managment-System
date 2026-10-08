from sqlalchemy.orm import Session
from modulos.matriculas.tabla import Matriculas
from modulos.secciones.tabla import Secciones


class MatriculaRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return (
            db.query(Matriculas)
            .filter(
                (Matriculas.estudiante_id == json.estudiante_id)
                & (Matriculas.seccion_id == json.seccion_id)
            )
            .first()
        )

    @staticmethod
    def guardar_matricula_repository(db: Session, matricula):
        db.add(matricula)
        db.commit()
        db.refresh(matricula)
        return matricula

    @staticmethod
    def listar_repository(db: Session, pagina_actual: int, limite: int, docente_id: int | None = None):
        query = db.query(Matriculas)
        if docente_id is not None:
            query = query.join(Secciones, Secciones.id == Matriculas.seccion_id).filter(
                Secciones.docente_id == docente_id
            )
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

    @staticmethod
    def buscar_repository(db: Session, id):
        return db.query(Matriculas).filter(Matriculas.id == id).first()

    @staticmethod
    def eliminar_matricula_repository(db: Session, matricula):
        db.delete(matricula)
        db.commit()
