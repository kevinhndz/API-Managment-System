from sqlalchemy import func
from datetime import date
from sqlalchemy.orm import Session
from modulos.asignaturas.tabla import Asignaturas
from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from modulos.secciones.tabla import Secciones
from modulos.periodos.tabla import Periodos
from modulos.aulas.tabla import Aulas
from modulos.calificaciones.tabla import Calificaciones


class ReportesRepository:
    @staticmethod
    def matriculas_repository(db: Session, periodo_id=None, estudiante_id=None, estado=None, carrera_id=None, desde: date | None = None, hasta: date | None = None):
        query = (
            db.query(
                Estudiantes.id.label("estudiante_id"),
                Estudiantes.nombre.label("estudiante"),
                Estudiantes.cuenta.label("cuenta"),
                Carreras.nombre.label("carrera"),
                Asignaturas.nombre.label("asignatura"),
                Secciones.codigo.label("seccion"),
                Periodos.anio.label("periodo"),
                Matriculas.estado,
                Matriculas.fecha_matricula,
                Calificaciones.nota_final,
            )
            .join(Matriculas, Matriculas.estudiante_id == Estudiantes.id)
            .join(Carreras, Carreras.id == Estudiantes.carrera_id)
            .join(Secciones, Secciones.id == Matriculas.seccion_id)
            .join(Asignaturas, Asignaturas.id == Secciones.asignatura_id)
            .join(Periodos, Periodos.id == Secciones.periodo_id)
            .outerjoin(Calificaciones, Calificaciones.matricula_id == Matriculas.id)
        )
        if periodo_id is not None:
            query = query.filter(Secciones.periodo_id == periodo_id)
        if estudiante_id is not None:
            query = query.filter(Matriculas.estudiante_id == estudiante_id)
        if estado is not None:
            query = query.filter(Matriculas.estado == estado)
        if carrera_id is not None:
            query = query.filter(Estudiantes.carrera_id == carrera_id)
        if desde is not None:
            query = query.filter(Matriculas.fecha_matricula >= desde)
        if hasta is not None:
            query = query.filter(Matriculas.fecha_matricula <= hasta)
        return query.all()

    @staticmethod
    def secciones_repository(db: Session, periodo_id=None, estado=None, carrera_id=None):
        query = (
            db.query(
                Secciones.codigo.label("seccion"),
                Asignaturas.nombre.label("asignatura"),
                (Docentes.nombres + " " + Docentes.apellidos).label("docente"),
                Periodos.anio.label("periodo"),
                Aulas.id.label("aula"),
                Secciones.estado.label("estado"),
                Secciones.cupo_maximo,
                func.count(Matriculas.id).label("matriculados"),
            )
            .join(Asignaturas, Asignaturas.id == Secciones.asignatura_id)
            .join(Carreras, Carreras.id == Asignaturas.carrera_id)
            .join(Docentes, Docentes.id == Secciones.docente_id)
            .join(Periodos, Periodos.id == Secciones.periodo_id)
            .join(Aulas, Aulas.id == Secciones.aula_id)
            .outerjoin(Matriculas, Matriculas.seccion_id == Secciones.id)
            .group_by(
                Secciones.codigo,
                Asignaturas.nombre,
                Docentes.nombres,
                Docentes.apellidos,
                Periodos.anio,
                Aulas.id,
                Secciones.estado,
                Secciones.cupo_maximo,
            )
        )
        if periodo_id is not None:
            query = query.filter(Secciones.periodo_id == periodo_id)
        if estado is not None:
            query = query.filter(Secciones.estado == estado)
        if carrera_id is not None:
            query = query.filter(Asignaturas.carrera_id == carrera_id)
        return query.all()

    @staticmethod
    def estudiantes_repository(db: Session, estado=None, carrera_id=None):
        query = db.query(
            Estudiantes.cuenta,
            Estudiantes.nombre,
            Estudiantes.correo,
            Carreras.nombre.label("carrera"),
            Estudiantes.estado,
        ).join(Carreras, Carreras.id == Estudiantes.carrera_id)
        if estado is not None:
            query = query.filter(Estudiantes.estado == (estado == "ACTIVO"))
        if carrera_id is not None:
            query = query.filter(Estudiantes.carrera_id == carrera_id)
        return query.all()

    @staticmethod
    def docentes_repository(db: Session, estado=None):
        query = db.query(Docentes.numero_empleado, Docentes.nombres, Docentes.apellidos, Docentes.correo, Docentes.estado)
        if estado is not None:
            query = query.filter(Docentes.estado == (estado == "ACTIVO"))
        return query.all()

    @staticmethod
    def calificaciones_repository(db: Session, periodo_id=None, carrera_id=None, docente_id=None):
        query = db.query(
            Estudiantes.cuenta,
            Estudiantes.nombre.label("estudiante"),
            Asignaturas.nombre.label("asignatura"),
            Secciones.codigo.label("seccion"),
            Periodos.anio.label("periodo"),
            Calificaciones.primer_parcial,
            Calificaciones.segundo_parcial,
            Calificaciones.tercer_parcial,
            Calificaciones.nota_final,
        ).join(Matriculas, Matriculas.id == Calificaciones.matricula_id).join(Estudiantes, Estudiantes.id == Matriculas.estudiante_id).join(Secciones, Secciones.id == Matriculas.seccion_id).join(Asignaturas, Asignaturas.id == Secciones.asignatura_id).join(Periodos, Periodos.id == Secciones.periodo_id)
        if periodo_id is not None:
            query = query.filter(Secciones.periodo_id == periodo_id)
        if carrera_id is not None:
            query = query.filter(Estudiantes.carrera_id == carrera_id)
        if docente_id is not None:
            query = query.filter(Secciones.docente_id == docente_id)
        return query.all()
