from sqlalchemy.orm import Session
from modulos.matriculas.tabla import Matriculas
from modulos.secciones.tabla import Secciones
from modulos.estudiantes.tabla import Estudiantes
from modulos.asignaturas.tabla import Asignaturas
from modulos.calificaciones.tabla import Calificaciones


class MatriculaRepository:
    @staticmethod
    def buscar_estudiante_bloqueado_repository(db: Session, estudiante_id: int):
        return db.query(Estudiantes).filter(Estudiantes.id == estudiante_id).with_for_update().first()

    @staticmethod
    def buscar_seccion_bloqueada_repository(db: Session, seccion_id: int):
        return db.query(Secciones).filter(Secciones.id == seccion_id).with_for_update().first()

    @staticmethod
    def buscar_duplicada_repository(db: Session, estudiante_id: int, seccion_id: int, excluir_id=None):
        return db.query(Matriculas).filter(
            Matriculas.estudiante_id == estudiante_id,
            Matriculas.seccion_id == seccion_id,
            Matriculas.id != excluir_id if excluir_id is not None else True,
        ).first()

    @staticmethod
    def buscar_asignatura_repository(db: Session, asignatura_id: int):
        return db.query(Asignaturas).filter(Asignaturas.id == asignatura_id).first()

    @staticmethod
    def buscar_requisito_aprobado_repository(db: Session, estudiante_id: int, requisito_id: int):
        return db.query(Calificaciones).join(
            Matriculas, Matriculas.id == Calificaciones.matricula_id,
        ).join(Secciones, Secciones.id == Matriculas.seccion_id).filter(
            Matriculas.estudiante_id == estudiante_id,
            Secciones.asignatura_id == requisito_id,
            Matriculas.estado == "APROBADA", Calificaciones.nota_final >= 60,
        ).first()

    @staticmethod
    def contar_activas_repository(db: Session, seccion_id: int, excluir_id=None):
        return db.query(Matriculas).filter(
            Matriculas.seccion_id == seccion_id,
            Matriculas.estado == "ACTIVA",
            Matriculas.id != excluir_id if excluir_id is not None else True,
        ).count()

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
