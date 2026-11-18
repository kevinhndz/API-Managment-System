from sqlalchemy import or_
from sqlalchemy.orm import Session
from modulos.secciones.tabla import Secciones
from modulos.aulas.tabla import Aulas
from modulos.matriculas.tabla import Matriculas


class SeccionRepository:
    @staticmethod
    def buscar_codigo_repository(db: Session, codigo: str, excluir_id=None):
        return db.query(Secciones).filter(
            Secciones.codigo == codigo,
            Secciones.id != excluir_id if excluir_id is not None else True,
        ).first()

    @staticmethod
    def buscar_referencia_bloqueada_repository(db: Session, modelo, referencia_id: int):
        return db.query(modelo).filter(modelo.id == referencia_id).with_for_update().first()

    @staticmethod
    def buscar_aula_repository(db: Session, aula_id: int):
        return db.query(Aulas).filter(Aulas.id == aula_id).first()

    @staticmethod
    def contar_matriculas_activas_repository(db: Session, seccion_id: int):
        return db.query(Matriculas).filter(
            Matriculas.seccion_id == seccion_id, Matriculas.estado == "ACTIVA",
        ).count()

    @staticmethod
    def listar_posibles_conflictos_repository(db: Session, periodo_id, docente_id, aula_id, excluir_id=None):
        return db.query(Secciones).filter(
            Secciones.periodo_id == periodo_id,
            or_(Secciones.docente_id == docente_id, Secciones.aula_id == aula_id),
            Secciones.id != excluir_id if excluir_id is not None else True,
        ).all()

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
