from sqlalchemy.orm import Session

from modulos.matriculas.tabla import Matriculas
from modulos.secciones.tabla import Secciones
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
    def listar_repository(db: Session, pagina_actual: int, limite: int, docente_id: int | None = None):
        query = db.query(Estudiantes)
        if docente_id is not None:
            query = query.join(Matriculas, Matriculas.estudiante_id == Estudiantes.id).join(
                Secciones, Secciones.id == Matriculas.seccion_id
            ).filter(Secciones.docente_id == docente_id).distinct()
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

    @staticmethod
    def buscar_repository(db: Session, id, docente_id: int | None = None):
        query = db.query(Estudiantes).filter(Estudiantes.id == id)
        if docente_id is not None:
            query = query.join(Matriculas, Matriculas.estudiante_id == Estudiantes.id).join(
                Secciones, Secciones.id == Matriculas.seccion_id
            ).filter(Secciones.docente_id == docente_id)
        return query.first()

    @staticmethod
    def eliminar_estudiante_repository(db: Session, estudiante):
        db.delete(estudiante)
        db.commit()
