from sqlalchemy.orm import Session
from modulos.reportes.repository import ReportesRepository as repo
from modulos.reportes.estrategicos import CONSULTAS
from modulos.reportes.exportadores import COLUMNAS, valor_json, exportar_csv, exportar_excel, exportar_json, exportar_pdf
from modulos.auditoria.registro import registrar_evento
from core.excepciones import AccesoProhibidoError, DatosInvalidosError


class ReportesService:
    @staticmethod
    def descargar_reporte(db: Session, modulo, formato, usuario, periodo_id=None, estudiante_id=None, estado=None, carrera_id=None, desde=None, hasta=None):
        registros = ReportesService.consultar_registros(
            db, modulo, usuario, periodo_id, estudiante_id, estado, carrera_id, desde, hasta,
        )
        if formato == "xlsx":
            respuesta = exportar_excel(modulo, registros)
        elif formato == "pdf":
            respuesta = exportar_pdf(modulo, registros)
        elif formato == "csv":
            respuesta = exportar_csv(modulo, registros)
        else:
            respuesta = exportar_json(modulo, registros)
        registrar_evento(
            db, "EXPORTAR", modulo,
            f"Descargo reporte {formato.upper()} de {modulo} con {len(registros)} registros",
        )
        return respuesta

    @staticmethod
    def consultar_registros(db: Session, modulo: str, usuario: dict, periodo_id=None, estudiante_id=None, estado=None, carrera_id=None, desde=None, hasta=None):
        es_docente = usuario["rol"].casefold() == "docente"
        if es_docente and modulo != "calificaciones":
            raise AccesoProhibidoError("Los docentes solo pueden consultar reportes de sus calificaciones")
        if desde and hasta and desde > hasta:
            raise DatosInvalidosError("La fecha inicial no puede superar la fecha final")

        if modulo in CONSULTAS:
            if es_docente:
                raise AccesoProhibidoError("Este reporte requiere permiso de administrador")
            if modulo == "carga_docente":
                return CONSULTAS[modulo](db, periodo_id)
            return CONSULTAS[modulo](db, periodo_id, carrera_id)

        if modulo == "matriculas":
            return repo.matriculas_repository(db, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)
        if modulo == "secciones":
            return repo.secciones_repository(db, periodo_id, estado, carrera_id)
        if modulo == "estudiantes":
            return repo.estudiantes_repository(db, estado, carrera_id)
        if modulo == "docentes":
            return repo.docentes_repository(db, estado)
        docente_id = usuario["docente_id"] if es_docente else None
        return repo.calificaciones_repository(db, periodo_id, carrera_id, docente_id)

    @staticmethod
    def vista_previa(db: Session, modulo: str, usuario: dict, periodo_id=None, estudiante_id=None, estado=None, carrera_id=None, desde=None, hasta=None):
        registros = ReportesService.consultar_registros(db, modulo, usuario, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)
        columnas = COLUMNAS[modulo]
        return {
            "modulo": modulo,
            "total_registros": len(registros),
            "columnas": [{"titulo": titulo, "campo": campo} for titulo, campo in columnas],
            "registros": [
                {campo: valor_json(item, campo) for _, campo in columnas}
                for item in registros[:20]
            ],
        }

    @staticmethod
    def reporte_matriculas_service(db: Session, periodo_id=None, estudiante_id=None, estado=None, carrera_id=None, desde=None, hasta=None):
        return repo.matriculas_repository(db, periodo_id, estudiante_id, estado, carrera_id, desde, hasta)

    @staticmethod
    def reporte_secciones_service(db: Session, periodo_id=None, estado=None, carrera_id=None):
        return repo.secciones_repository(db, periodo_id, estado, carrera_id)
