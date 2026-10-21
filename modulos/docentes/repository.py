from datetime import date

from sqlalchemy import and_
from sqlalchemy.orm import Session

from modulos.docentes.tabla import Docentes
from modulos.secciones.tabla import Secciones
from modulos.asignaturas.tabla import Asignaturas
from modulos.periodos.tabla import Periodos


class DocenteRepository:
    @staticmethod
    def carga_repository(db: Session):
        return (db.query(
            Docentes.id.label("docente_id"), Docentes.numero_empleado, Docentes.nombres, Docentes.apellidos,
            Docentes.tipo_contrato, Docentes.departamento, Secciones.codigo.label("seccion"),
            Secciones.estado.label("estado_seccion"), Secciones.dias, Secciones.hora_inicio,
            Secciones.hora_fin, Asignaturas.id.label("asignatura_id"),
            Asignaturas.codigo.label("codigo_asignatura"), Asignaturas.nombre.label("asignatura"),
            Periodos.id.label("periodo_id"), Periodos.anio, Periodos.numero,
            and_(Periodos.activo.is_(True), Periodos.fecha_inicio <= date.today(),
                 Periodos.fecha_fin >= date.today(), Secciones.estado == "ABIERTA").label("vigente"),
        ).select_from(Secciones)
         .join(Docentes, Docentes.id == Secciones.docente_id)
         .join(Asignaturas, Asignaturas.id == Secciones.asignatura_id)
         .join(Periodos, Periodos.id == Secciones.periodo_id)
         .filter(Secciones.institucion_id == db.info["institucion_id"])
         .order_by(Periodos.anio.desc(), Periodos.numero.desc(), Docentes.apellidos, Secciones.codigo)
         .all())
    @staticmethod
    def tiene_secciones_repository(db: Session, docente_id: int):
        return db.query(Secciones).filter(Secciones.docente_id == docente_id).first()

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
