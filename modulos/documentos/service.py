from datetime import datetime, timezone
from hashlib import sha256
from html import escape
from io import BytesIO
from uuid import uuid4

from fastapi.responses import Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from core.excepciones import DatosInvalidosError, RecursoNoEncontradoError
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


def _institucion(db: Session) -> Instituciones:
    institucion_id = db.info.get("institucion_id")
    institucion = db.get(Instituciones, institucion_id) if institucion_id else None
    if institucion is None:
        raise RecursoNoEncontradoError("Institucion no encontrada")
    return institucion


def _texto(valor) -> str:
    return escape(str(valor if valor is not None else ""))


def _pdf(titulo: str, institucion: str, folio: str, fecha: datetime, cuerpo: list) -> bytes:
    archivo = BytesIO()
    estilos = getSampleStyleSheet()
    documento = SimpleDocTemplate(archivo, pagesize=A4, leftMargin=42, rightMargin=42)
    elementos = [
        Paragraph(_texto(institucion), estilos["Heading2"]),
        Paragraph(_texto(titulo), estilos["Title"]),
        Paragraph(f"Folio: {_texto(folio)} | Emitido: {fecha:%Y-%m-%d %H:%M} UTC", estilos["Normal"]),
        Spacer(1, 20),
        *cuerpo,
        Spacer(1, 18),
        Paragraph("Documento generado con los datos registrados por la institucion a la fecha de emision.", estilos["Italic"]),
    ]
    documento.build(elementos)
    return archivo.getvalue()


def _entregar(db: Session, tipo: str, sujeto_id: int, usuario_id: int, folio: str, fecha: datetime, contenido: bytes) -> Response:
    db.add(
        DocumentosEmitidos(
            institucion_id=db.info["institucion_id"],
            folio=folio,
            tipo=tipo,
            sujeto_id=sujeto_id,
            emitido_por=usuario_id,
            emitido_en=fecha,
            hash_pdf=sha256(contenido).hexdigest(),
        )
    )
    db.commit()
    return Response(
        content=contenido,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{tipo}_{sujeto_id}_{folio}.pdf"'},
    )


def historial_academico(db: Session, estudiante_id: int, usuario_id: int) -> Response:
    institucion = _institucion(db)
    estudiante = db.query(Estudiantes).filter(
        Estudiantes.id == estudiante_id,
        Estudiantes.institucion_id == institucion.id,
    ).one_or_none()
    if estudiante is None:
        raise RecursoNoEncontradoError("Estudiante no encontrado")
    carrera = db.query(Carreras).filter(
        Carreras.id == estudiante.carrera_id,
        Carreras.institucion_id == institucion.id,
    ).one()
    registros = (
        db.query(Periodos.anio, Periodos.numero, Asignaturas.codigo, Asignaturas.nombre,
                 Asignaturas.unidades_valorativas, Calificaciones.nota_final)
        .select_from(Calificaciones)
        .join(Matriculas, Matriculas.id == Calificaciones.matricula_id)
        .join(Secciones, Secciones.id == Matriculas.seccion_id)
        .join(Asignaturas, Asignaturas.id == Secciones.asignatura_id)
        .join(Periodos, Periodos.id == Secciones.periodo_id)
        .filter(
            Matriculas.estudiante_id == estudiante_id,
            Calificaciones.institucion_id == institucion.id,
            Matriculas.estado != "CANCELADA",
        )
        .order_by(Periodos.anio, Periodos.numero, Asignaturas.codigo)
        .all()
    )
    estilos = getSampleStyleSheet()
    filas = [["Periodo", "Codigo", "Asignatura", "UV", "Nota final"]]
    for registro in registros:
        filas.append([
            f"{registro.anio}-{registro.numero}",
            _texto(registro.codigo),
            Paragraph(_texto(registro.nombre), estilos["BodyText"]),
            str(registro.unidades_valorativas),
            str(registro.nota_final),
        ])
    if len(filas) == 1:
        filas.append(["", "", "Sin calificaciones registradas", "", ""])
    tabla = Table(filas, colWidths=[65, 65, 285, 35, 60], repeatRows=1)
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e9edf3")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.HexColor("#45546a")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f8fa")]),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    folio = str(uuid4())
    fecha = datetime.now(timezone.utc)
    contenido = _pdf(
        "Historial academico", institucion.nombre, folio, fecha,
        [
            Paragraph(f"Estudiante: {_texto(estudiante.nombre)}", estilos["Normal"]),
            Paragraph(f"Cuenta: {_texto(estudiante.cuenta)}", estilos["Normal"]),
            Paragraph(f"Carrera: {_texto(carrera.nombre)}", estilos["Normal"]),
            Spacer(1, 16),
            tabla,
        ],
    )
    return _entregar(db, "historial_academico", estudiante.id, usuario_id, folio, fecha, contenido)


def constancia_laboral(db: Session, docente_id: int, usuario_id: int) -> Response:
    institucion = _institucion(db)
    docente = db.query(Docentes).filter(
        Docentes.id == docente_id,
        Docentes.institucion_id == institucion.id,
    ).one_or_none()
    if docente is None:
        raise RecursoNoEncontradoError("Docente no encontrado")
    if not docente.estado:
        raise DatosInvalidosError("Solo se puede emitir constancia laboral de un docente activo")
    if not docente.cargo or not docente.fecha_ingreso:
        raise DatosInvalidosError("Completa cargo y fecha de ingreso del docente antes de emitir la constancia")

    estilos = getSampleStyleSheet()
    nombre = f"{docente.nombres} {docente.apellidos}"
    parrafos = [
        f"{_texto(institucion.nombre)} hace constar que {_texto(nombre)}, con numero de empleado "
        f"{_texto(docente.numero_empleado)}, figura como docente activo en sus registros.",
        f"Cargo: {_texto(docente.cargo)}. Fecha de ingreso registrada: {docente.fecha_ingreso:%Y-%m-%d}.",
    ]
    if docente.departamento:
        parrafos.append(f"Departamento: {_texto(docente.departamento)}.")
    if docente.tipo_contrato:
        parrafos.append(f"Tipo de contrato: {_texto(docente.tipo_contrato)}.")
    folio = str(uuid4())
    fecha = datetime.now(timezone.utc)
    contenido = _pdf(
        "Constancia laboral", institucion.nombre, folio, fecha,
        [Paragraph(parrafo, estilos["BodyText"]) for parrafo in parrafos],
    )
    return _entregar(db, "constancia_laboral", docente.id, usuario_id, folio, fecha, contenido)
