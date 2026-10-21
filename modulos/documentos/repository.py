from datetime import datetime

from sqlalchemy.orm import Session

from database.almacen import Instituciones
from modulos.asignaturas.tabla import Asignaturas
from modulos.calificaciones.tabla import Calificaciones
from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.documentos.tabla import DocumentosEmitidos
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from modulos.periodos.tabla import Periodos
from modulos.secciones.tabla import Secciones


def buscar_institucion(db: Session, institucion_id: int) -> Instituciones | None:
    return db.get(Instituciones, institucion_id)


def buscar_estudiante(db: Session, estudiante_id: int, institucion_id: int) -> Estudiantes | None:
    return db.query(Estudiantes).filter(
        Estudiantes.id == estudiante_id,
        Estudiantes.institucion_id == institucion_id,
    ).one_or_none()


def buscar_carrera(db: Session, carrera_id: int, institucion_id: int) -> Carreras | None:
    return db.query(Carreras).filter(
        Carreras.id == carrera_id,
        Carreras.institucion_id == institucion_id,
    ).one_or_none()


def listar_calificaciones(db: Session, estudiante_id: int, institucion_id: int):
    return (
        db.query(Periodos.anio, Periodos.numero, Asignaturas.codigo, Asignaturas.nombre,
                 Asignaturas.unidades_valorativas, Calificaciones.nota_final)
        .select_from(Calificaciones)
        .join(Matriculas, Matriculas.id == Calificaciones.matricula_id)
        .join(Secciones, Secciones.id == Matriculas.seccion_id)
        .join(Asignaturas, Asignaturas.id == Secciones.asignatura_id)
        .join(Periodos, Periodos.id == Secciones.periodo_id)
        .filter(
            Matriculas.estudiante_id == estudiante_id,
            Calificaciones.institucion_id == institucion_id,
            Matriculas.estado != "CANCELADA",
        )
        .order_by(Periodos.anio, Periodos.numero, Asignaturas.codigo)
        .all()
    )


def buscar_docente(db: Session, docente_id: int, institucion_id: int) -> Docentes | None:
    return db.query(Docentes).filter(
        Docentes.id == docente_id,
        Docentes.institucion_id == institucion_id,
    ).one_or_none()


def listar_matriculas_activas(db: Session, estudiante_id: int, institucion_id: int):
    return (
        db.query(Periodos.anio, Periodos.numero, Asignaturas.codigo, Asignaturas.nombre, Secciones.codigo.label("seccion"))
        .select_from(Matriculas)
        .join(Secciones, Secciones.id == Matriculas.seccion_id)
        .join(Asignaturas, Asignaturas.id == Secciones.asignatura_id)
        .join(Periodos, Periodos.id == Secciones.periodo_id)
        .filter(Matriculas.estudiante_id == estudiante_id, Matriculas.institucion_id == institucion_id,
                Matriculas.estado == "ACTIVA")
        .order_by(Periodos.anio.desc(), Periodos.numero.desc(), Asignaturas.codigo)
        .all()
    )


def guardar_emision(db: Session, institucion_id: int, tipo: str, sujeto_id: int,
                    usuario_id: int, folio: str, fecha: datetime, hash_pdf: str) -> None:
    db.add(DocumentosEmitidos(
        institucion_id=institucion_id,
        folio=folio,
        tipo=tipo,
        sujeto_id=sujeto_id,
        emitido_por=usuario_id,
        emitido_en=fecha,
        hash_pdf=hash_pdf,
    ))
    db.commit()


def buscar_emision(db: Session, folio: str, institucion_id: int) -> DocumentosEmitidos | None:
    return db.query(DocumentosEmitidos).filter(
        DocumentosEmitidos.folio == folio,
        DocumentosEmitidos.institucion_id == institucion_id,
    ).one_or_none()


def leer_logo(db: Session, institucion_id: int) -> bytes | None:
    institucion = buscar_institucion(db, institucion_id)
    return institucion.logo_png if institucion else None


def guardar_logo(db: Session, institucion_id: int, contenido: bytes) -> None:
    institucion = buscar_institucion(db, institucion_id)
    if institucion is None:
        raise ValueError("Institucion no encontrada")
    institucion.logo_png = contenido
    db.commit()
