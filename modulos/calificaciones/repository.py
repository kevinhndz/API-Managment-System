from sqlalchemy.orm import Session
from modulos.calificaciones.tabla import Calificaciones
from modulos.matriculas.tabla import Matriculas
from modulos.secciones.tabla import Secciones


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
    def listar_repository(db: Session, pagina_actual: int, limite: int, docente_id: int | None = None):
        query = db.query(Calificaciones)
        if docente_id is not None:
            query = query.join(Matriculas, Matriculas.id == Calificaciones.matricula_id).join(
                Secciones, Secciones.id == Matriculas.seccion_id
            ).filter(Secciones.docente_id == docente_id)
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

    @staticmethod
    def buscar_repository(db: Session, id, docente_id: int | None = None):
        query = db.query(Calificaciones).filter(Calificaciones.id == id)
        if docente_id is not None:
            query = query.join(Matriculas, Matriculas.id == Calificaciones.matricula_id).join(
                Secciones, Secciones.id == Matriculas.seccion_id
            ).filter(Secciones.docente_id == docente_id)
        return query.first()

    @staticmethod
    def eliminar_calificacion_repository(db: Session, calificacion):
        db.delete(calificacion)
        db.commit()
