from sqlalchemy.orm import Session

from modulos.docentes.tabla import Docentes


class DocenteRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return (
            db.query(Docentes)
            .filter(
                (Docentes.numero_empleado == json.numero_empleado)
                | (Docentes.correo == json.correo)
            )
            .first()
        )

    @staticmethod
    def listar_repository(
        db: Session, pagina_actual: int, limite: int, busqueda: str | None = None
    ):
        query = db.query(Docentes)
        if busqueda:
            texto = f"%{busqueda}%"
            query = query.filter(
                (Docentes.numero_empleado.ilike(texto))
                | (Docentes.nombres.ilike(texto))
                | (Docentes.apellidos.ilike(texto))
                | (Docentes.correo.ilike(texto))
                | (Docentes.especialidad.ilike(texto))
            )
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

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
