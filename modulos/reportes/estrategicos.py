"""Consultas de gestion basadas en datos academicos existentes."""

from sqlalchemy import Numeric, and_, cast, func
from sqlalchemy.orm import Session

from modulos.asignaturas.tabla import Asignaturas
from modulos.calificaciones.tabla import Calificaciones
from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from modulos.periodos.tabla import Periodos
from modulos.secciones.tabla import Secciones


def _institucion(db: Session) -> int:
    institucion_id = db.info.get("institucion_id")
    if institucion_id is None:
        raise ValueError("Se requiere una institucion para consultar reportes")
    return institucion_id


def matricula_por_carrera(db: Session, periodo_id=None, carrera_id=None):
    consulta = (
        db.query(
            Periodos.anio.label("anio"),
            Periodos.numero.label("periodo"),
            Carreras.codigo.label("codigo_carrera"),
            Carreras.nombre.label("carrera"),
            func.count(Matriculas.id).label("matriculas"),
            func.count(func.distinct(Estudiantes.id)).label("estudiantes"),
        )
        .select_from(Matriculas)
        .join(Secciones, Secciones.id == Matriculas.seccion_id)
        .join(Periodos, Periodos.id == Secciones.periodo_id)
        .join(Estudiantes, Estudiantes.id == Matriculas.estudiante_id)
        .join(Carreras, Carreras.id == Estudiantes.carrera_id)
        .filter(
            Matriculas.institucion_id == _institucion(db),
            Matriculas.estado != "CANCELADA",
        )
    )
    if periodo_id is not None:
        consulta = consulta.filter(Periodos.id == periodo_id)
    if carrera_id is not None:
        consulta = consulta.filter(Carreras.id == carrera_id)
    return (
        consulta.group_by(Periodos.id, Carreras.id)
        .order_by(Periodos.anio.desc(), Periodos.numero.desc(), Carreras.nombre)
        .all()
    )


def ocupacion_de_secciones(db: Session, periodo_id=None, carrera_id=None):
    inscritos = func.count(Matriculas.id)
    porcentaje = func.round(
        cast(inscritos * 100, Numeric) / func.nullif(Secciones.cupo_maximo, 0), 1
    )
    consulta = (
        db.query(
            Periodos.anio.label("anio"),
            Periodos.numero.label("periodo"),
            Carreras.nombre.label("carrera"),
            Asignaturas.codigo.label("codigo_asignatura"),
            Asignaturas.nombre.label("asignatura"),
            Secciones.codigo.label("seccion"),
            Secciones.cupo_maximo.label("cupo"),
            inscritos.label("inscritos"),
            (Secciones.cupo_maximo - inscritos).label("cupos_libres"),
            porcentaje.label("ocupacion_pct"),
        )
        .select_from(Secciones)
        .join(Asignaturas, Asignaturas.id == Secciones.asignatura_id)
        .join(Carreras, Carreras.id == Asignaturas.carrera_id)
        .join(Periodos, Periodos.id == Secciones.periodo_id)
        .outerjoin(
            Matriculas,
            and_(
                Matriculas.seccion_id == Secciones.id,
                Matriculas.estado != "CANCELADA",
            ),
        )
        .filter(Secciones.institucion_id == _institucion(db))
    )
    if periodo_id is not None:
        consulta = consulta.filter(Secciones.periodo_id == periodo_id)
    if carrera_id is not None:
        consulta = consulta.filter(Carreras.id == carrera_id)
    return (
        consulta.group_by(Secciones.id, Asignaturas.id, Carreras.id, Periodos.id)
        .order_by(Periodos.anio.desc(), Periodos.numero.desc(), Carreras.nombre, Secciones.codigo)
        .all()
    )


def rendimiento_por_asignatura(db: Session, periodo_id=None, carrera_id=None):
    consulta = (
        db.query(
            Periodos.anio.label("anio"),
            Periodos.numero.label("periodo"),
            Carreras.nombre.label("carrera"),
            Asignaturas.codigo.label("codigo_asignatura"),
            Asignaturas.nombre.label("asignatura"),
            func.count(Calificaciones.id).label("calificados"),
            func.round(func.avg(Calificaciones.nota_final), 2).label("promedio"),
            func.min(Calificaciones.nota_final).label("nota_minima"),
            func.max(Calificaciones.nota_final).label("nota_maxima"),
        )
        .select_from(Calificaciones)
        .join(Matriculas, Matriculas.id == Calificaciones.matricula_id)
        .join(Secciones, Secciones.id == Matriculas.seccion_id)
        .join(Asignaturas, Asignaturas.id == Secciones.asignatura_id)
        .join(Carreras, Carreras.id == Asignaturas.carrera_id)
        .join(Periodos, Periodos.id == Secciones.periodo_id)
        .filter(
            Calificaciones.institucion_id == _institucion(db),
            Matriculas.estado != "CANCELADA",
        )
    )
    if periodo_id is not None:
        consulta = consulta.filter(Periodos.id == periodo_id)
    if carrera_id is not None:
        consulta = consulta.filter(Carreras.id == carrera_id)
    return (
        consulta.group_by(Periodos.id, Carreras.id, Asignaturas.id)
        .order_by(Periodos.anio.desc(), Periodos.numero.desc(), Carreras.nombre, Asignaturas.nombre)
        .all()
    )


def carga_docente(db: Session, periodo_id=None):
    secciones = func.count(func.distinct(Secciones.id))
    inscritos = func.count(Matriculas.id)
    consulta = (
        db.query(
            Periodos.anio.label("anio"),
            Periodos.numero.label("periodo"),
            Docentes.numero_empleado.label("numero_empleado"),
            Docentes.nombres.label("nombres"),
            Docentes.apellidos.label("apellidos"),
            secciones.label("secciones"),
            inscritos.label("estudiantes_inscritos"),
        )
        .select_from(Secciones)
        .join(Docentes, Docentes.id == Secciones.docente_id)
        .join(Periodos, Periodos.id == Secciones.periodo_id)
        .outerjoin(
            Matriculas,
            and_(
                Matriculas.seccion_id == Secciones.id,
                Matriculas.estado != "CANCELADA",
            ),
        )
        .filter(Secciones.institucion_id == _institucion(db))
    )
    if periodo_id is not None:
        consulta = consulta.filter(Periodos.id == periodo_id)
    return (
        consulta.group_by(Periodos.id, Docentes.id)
        .order_by(Periodos.anio.desc(), Periodos.numero.desc(), Docentes.apellidos)
        .all()
    )


CONSULTAS = {
    "matricula_carrera": matricula_por_carrera,
    "ocupacion_secciones": ocupacion_de_secciones,
    "rendimiento_asignaturas": rendimiento_por_asignatura,
    "carga_docente": carga_docente,
}
