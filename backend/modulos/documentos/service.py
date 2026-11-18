from datetime import datetime, timezone
from hashlib import sha256
from html import escape
from io import BytesIO
from uuid import uuid4

from PIL import Image as ImagenPIL, UnidentifiedImageError
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from reportlab.platypus import HRFlowable, Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from core.excepciones import DatosInvalidosError, RecursoNoEncontradoError
from database.almacen import Instituciones
from modulos.documentos import repository as repo


def _institucion(db: Session) -> Instituciones:
    institucion_id = db.info.get("institucion_id")
    institucion = repo.buscar_institucion(db, institucion_id) if institucion_id else None
    if institucion is None:
        raise RecursoNoEncontradoError("Institucion no encontrada")
    return institucion


def _texto(valor) -> str:
    return escape(str(valor if valor is not None else ""))


def _pdf(titulo: str, institucion: Instituciones, logo: bytes | None, folio: str, fecha: datetime, cuerpo: list) -> bytes:
    archivo = BytesIO()
    estilos = getSampleStyleSheet()
    documento = SimpleDocTemplate(archivo, pagesize=A4, leftMargin=42, rightMargin=42)
    color_marca = colors.HexColor("#5b0309")
    nombre_estilo = ParagraphStyle("NombreInstitucion", parent=estilos["Heading2"], textColor=color_marca, fontSize=15, leading=19)
    subtitulo_estilo = ParagraphStyle("AreaDocumento", parent=estilos["Normal"], textColor=colors.HexColor("#667085"), fontSize=9)
    titulo_estilo = ParagraphStyle("TituloDocumento", parent=estilos["Title"], textColor=color_marca, fontSize=19, leading=24)
    if logo:
        ancho, alto = ImageReader(BytesIO(logo)).getSize()
        escala = min(80 / ancho, 62 / alto)
        marca = Image(BytesIO(logo), width=ancho * escala, height=alto * escala)
    else:
        marca = Paragraph(_texto(institucion.slug.upper()), nombre_estilo)
    encabezado = Table([[
        marca,
        [Paragraph(_texto(institucion.nombre), nombre_estilo), Paragraph("SECRETARIA ACADEMICA", subtitulo_estilo)],
    ]], colWidths=[90, A4[0] - 174])
    encabezado.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elementos = [
        encabezado,
        HRFlowable(width="100%", thickness=1.5, color=color_marca),
        Spacer(1, 22),
        Paragraph(_texto(titulo), titulo_estilo),
        Paragraph(f"Folio: {_texto(folio)} | Emitido: {fecha:%Y-%m-%d %H:%M} UTC", estilos["Normal"]),
        Spacer(1, 20),
        *cuerpo,
        Spacer(1, 18),
        Paragraph("Documento generado con los datos registrados por la institucion a la fecha de emision.", estilos["Italic"]),
    ]
    def pie_pagina(lienzo, doc):
        lienzo.setStrokeColor(colors.HexColor("#d8c6c6"))
        lienzo.line(42, 38, A4[0] - 42, 38)
        lienzo.setFont("Helvetica", 8)
        lienzo.setFillColor(colors.HexColor("#667085"))
        lienzo.drawString(42, 27, "Documento institucional verificable por folio")
        lienzo.drawRightString(A4[0] - 42, 27, f"Pagina {doc.page}")

    documento.build(elementos, onFirstPage=pie_pagina, onLaterPages=pie_pagina)
    return archivo.getvalue()


def _entregar(db: Session, tipo: str, sujeto_id: int, usuario_id: int, folio: str, fecha: datetime, contenido: bytes) -> tuple[bytes, str]:
    repo.guardar_emision(
        db, db.info["institucion_id"], tipo, sujeto_id, usuario_id,
        folio, fecha, sha256(contenido).hexdigest(),
    )
    return contenido, f"{tipo}_{sujeto_id}_{folio}.pdf"


def historial_academico(db: Session, estudiante_id: int, usuario_id: int, emitir: bool = True) -> tuple[bytes, str]:
    institucion = _institucion(db)
    estudiante = repo.buscar_estudiante(db, estudiante_id, institucion.id)
    if estudiante is None:
        raise RecursoNoEncontradoError("Estudiante no encontrado")
    carrera = repo.buscar_carrera(db, estudiante.carrera_id, institucion.id)
    if carrera is None:
        raise RecursoNoEncontradoError("Carrera no encontrada")
    registros = repo.listar_calificaciones(db, estudiante_id, institucion.id)
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
    folio = str(uuid4()) if emitir else "VISTA PREVIA"
    fecha = datetime.now(timezone.utc)
    contenido = _pdf(
        "Historial academico", institucion, repo.leer_logo(db, institucion.id), folio, fecha,
        [
            Paragraph(f"Estudiante: {_texto(estudiante.nombre)}", estilos["Normal"]),
            Paragraph(f"Cuenta: {_texto(estudiante.cuenta)}", estilos["Normal"]),
            Paragraph(f"Carrera: {_texto(carrera.nombre)}", estilos["Normal"]),
            Spacer(1, 16),
            tabla,
        ],
    )
    if emitir:
        return _entregar(db, "historial_academico", estudiante.id, usuario_id, folio, fecha, contenido)
    return contenido, f"historial_academico_{estudiante.id}_vista_previa.pdf"


def constancia_laboral(db: Session, docente_id: int, usuario_id: int, emitir: bool = True) -> tuple[bytes, str]:
    institucion = _institucion(db)
    docente = repo.buscar_docente(db, docente_id, institucion.id)
    if docente is None:
        raise RecursoNoEncontradoError("Docente no encontrado")
    if not docente.estado:
        raise DatosInvalidosError("Solo se puede emitir constancia laboral de un docente activo")
    estilos = getSampleStyleSheet()
    nombre = f"{docente.nombres} {docente.apellidos}"
    parrafos = [
        f"{_texto(institucion.nombre)} hace constar que {_texto(nombre)}, con numero de empleado "
        f"{_texto(docente.numero_empleado)}, figura como docente activo en sus registros.",
    ]
    if docente.cargo:
        parrafos.append(f"Cargo: {_texto(docente.cargo)}.")
    if docente.fecha_ingreso:
        parrafos.append(f"Fecha de ingreso registrada: {docente.fecha_ingreso:%Y-%m-%d}.")
    if docente.departamento:
        parrafos.append(f"Departamento: {_texto(docente.departamento)}.")
    if docente.tipo_contrato:
        parrafos.append(f"Tipo de contrato: {_texto(docente.tipo_contrato)}.")
    folio = str(uuid4()) if emitir else "VISTA PREVIA"
    fecha = datetime.now(timezone.utc)
    contenido = _pdf(
        "Constancia laboral", institucion, repo.leer_logo(db, institucion.id), folio, fecha,
        [Paragraph(parrafo, estilos["BodyText"]) for parrafo in parrafos],
    )
    if emitir:
        return _entregar(db, "constancia_laboral", docente.id, usuario_id, folio, fecha, contenido)
    return contenido, f"constancia_laboral_{docente.id}_vista_previa.pdf"


def constancia_estudiantil(db: Session, estudiante_id: int, usuario_id: int, emitir: bool = True) -> tuple[bytes, str]:
    institucion = _institucion(db)
    estudiante = repo.buscar_estudiante(db, estudiante_id, institucion.id)
    if estudiante is None:
        raise RecursoNoEncontradoError("Estudiante no encontrado")
    carrera = repo.buscar_carrera(db, estudiante.carrera_id, institucion.id)
    matriculas = repo.listar_matriculas_activas(db, estudiante_id, institucion.id)
    if not matriculas:
        raise DatosInvalidosError("El estudiante no tiene matriculas activas para emitir la constancia")
    anio, numero = matriculas[0].anio, matriculas[0].numero
    actuales = [item for item in matriculas if (item.anio, item.numero) == (anio, numero)]
    estilos = getSampleStyleSheet()
    filas = [["Codigo", "Asignatura", "Seccion"]]
    filas.extend([_texto(item.codigo), Paragraph(_texto(item.nombre), estilos["BodyText"]), _texto(item.seccion)] for item in actuales)
    tabla = Table(filas, colWidths=[90, 355, 65], repeatRows=1)
    tabla.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e9edf3")),
                               ("VALIGN", (0, 0), (-1, -1), "TOP"),
                               ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f8fa")])]))
    folio = str(uuid4()) if emitir else "VISTA PREVIA"
    fecha = datetime.now(timezone.utc)
    contenido = _pdf("Constancia estudiantil", institucion, repo.leer_logo(db, institucion.id), folio, fecha, [
        Paragraph(f"{_texto(institucion.nombre)} hace constar que {_texto(estudiante.nombre)}, numero de cuenta {_texto(estudiante.cuenta)}, tiene matricula activa en el periodo {anio}-{numero}.", estilos["BodyText"]),
        Paragraph(f"Carrera: {_texto(carrera.nombre if carrera else 'No registrada')}", estilos["BodyText"]),
        Spacer(1, 14), tabla,
    ])
    if emitir:
        return _entregar(db, "constancia_estudiantil", estudiante.id, usuario_id, folio, fecha, contenido)
    return contenido, f"constancia_estudiantil_{estudiante.id}_vista_previa.pdf"


def verificar_documento(db: Session, folio: str) -> dict:
    institucion = _institucion(db)
    documento = repo.buscar_emision(db, folio, institucion.id)
    if documento is None:
        raise RecursoNoEncontradoError("Documento no encontrado")
    return {
        "folio": documento.folio,
        "tipo": documento.tipo,
        "institucion": institucion.nombre,
        "emitido_en": documento.emitido_en,
        "hash_pdf": documento.hash_pdf,
    }


def guardar_logo(db: Session, contenido: bytes) -> None:
    institucion = _institucion(db)
    try:
        with ImagenPIL.open(BytesIO(contenido)) as imagen:
            if imagen.format not in {"PNG", "JPEG"} or imagen.width * imagen.height > 4_000_000:
                raise DatosInvalidosError("Usa un logo PNG o JPG de hasta 4 megapixeles")
            imagen.thumbnail((600, 600))
            archivo = BytesIO()
            imagen.convert("RGBA").save(archivo, format="PNG")
    except (UnidentifiedImageError, OSError) as error:
        raise DatosInvalidosError("El archivo no es una imagen PNG o JPG valida") from error
    repo.guardar_logo(db, institucion.id, archivo.getvalue())


def leer_logo(db: Session) -> bytes | None:
    return repo.leer_logo(db, _institucion(db).id)
