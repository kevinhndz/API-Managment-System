import csv
import re
from pathlib import Path
from sqlalchemy.orm import Session
from openpyxl import Workbook

from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas


# Esta carpeta guarda temporalmente reportes generados por el chatbot.
REPORTES_DIR = Path("reportes_generados")


class ChatbotService:
    # Normaliza palabras para tolerar mayusculas y errores sencillos.
    @staticmethod
    def normalizar(texto: str) -> str:
        texto_limpio = re.sub(r"[^a-z0-9 ]", "", texto.lower())
        return texto_limpio.replace("inactib", "inactiv")

    # Selecciona una funcion de negocio segun palabras y sinonimos del usuario.
    @staticmethod
    def interpretar(mensaje: str) -> tuple[str, str]:
        texto = ChatbotService.normalizar(mensaje)
        reporte = any(palabra in texto for palabra in ["excel", "reporte", "archivo", "descargar", "listado"])
        if any(palabra in texto for palabra in ["docente", "docentes", "maestro", "maestros", "profesor", "profesores", "profe", "profes"]):
            estado = "inactivo" if any(palabra in texto for palabra in ["inactivo", "desactivado", "no trabaja", "no trabajan"]) else "activo" if "activo" in texto else "todos"
            return ("generar_excel_docentes" if reporte else "listar_docentes", estado)
        if any(palabra in texto for palabra in ["matricula", "matriculas", "inscripcion", "inscripciones"]):
            estado = "cancelada" if "cancel" in texto else "activa" if any(palabra in texto for palabra in ["activa", "activas", "vigente", "vigentes"]) else "todos"
            return ("generar_excel_matriculas" if reporte else "listar_matriculas", estado)
        if any(palabra in texto for palabra in ["estudiante", "estudiantes", "alumno", "alumnos"]):
            estado = "inactivo" if any(palabra in texto for palabra in ["inactivo", "desactivado", "desactivados"]) else "activo" if "activo" in texto else "todos"
            return ("listar_estudiantes", estado)
        return ("ayuda", "todos")

    # Ejecuta la funcion de negocio para docentes.
    @staticmethod
    def docentes(db: Session, estado: str) -> list[dict]:
        consulta = db.query(Docentes)
        if estado in {"activo", "inactivo"}:
            consulta = consulta.filter(Docentes.estado == (estado == "activo"))
        return [{"id": item.id, "numero_empleado": item.numero_empleado, "nombre": f"{item.nombres} {item.apellidos}", "correo": item.correo, "estado": "Activo" if item.estado else "Inactivo"} for item in consulta.all()]

    # Ejecuta la funcion de negocio para estudiantes.
    @staticmethod
    def estudiantes(db: Session, estado: str) -> list[dict]:
        consulta = db.query(Estudiantes)
        if estado in {"activo", "inactivo"}:
            consulta = consulta.filter(Estudiantes.estado == (estado == "activo"))
        return [{"id": item.id, "cuenta": item.cuenta, "nombre": item.nombre, "correo": item.correo, "estado": "Activo" if item.estado else "Inactivo"} for item in consulta.all()]

    # Ejecuta la funcion de negocio para matriculas.
    @staticmethod
    def matriculas(db: Session, estado: str) -> list[dict]:
        consulta = db.query(Matriculas)
        if estado != "todos":
            consulta = consulta.filter(Matriculas.estado.ilike(estado))
        return [{"id": item.id, "estudiante_id": item.estudiante_id, "seccion_id": item.seccion_id, "fecha": str(item.fecha_matricula), "estado": item.estado} for item in consulta.all()]

    # Crea un archivo XLSX real y devuelve su nombre descargable.
    @staticmethod
    def crear_csv(nombre: str, filas: list[dict]) -> str:
        REPORTES_DIR.mkdir(exist_ok=True)
        ruta = REPORTES_DIR / nombre.replace('.csv', '.xlsx')
        columnas = list(filas[0].keys()) if filas else ["resultado"]
        libro = Workbook()
        hoja = libro.active
        hoja.append(columnas)
        for fila in filas:
            hoja.append([fila.get(columna, '') for columna in columnas])
        hoja.freeze_panes = 'A2'
        hoja.auto_filter.ref = hoja.dimensions
        libro.save(ruta)
        return ruta.name

    # Coordina interpretacion, consulta y generacion del archivo.
    @staticmethod
    def responder(db: Session, mensaje: str) -> dict:
        funcion, estado = ChatbotService.interpretar(mensaje)
        if funcion == "ayuda":
            return {"respuesta": "Puedo listar docentes o estudiantes por estado y generar reportes CSV compatibles con Excel de docentes y matriculas.", "filas": [], "archivo": None}
        if funcion in {"listar_docentes", "generar_excel_docentes"}:
            filas = ChatbotService.docentes(db, estado)
            archivo = ChatbotService.crear_csv(f"docentes-{estado}.csv", filas) if funcion.startswith("generar") else None
            return {"respuesta": f"Encontre {len(filas)} docentes con estado {estado}.", "filas": filas[:50], "archivo": archivo}
        if funcion == "listar_estudiantes":
            filas = ChatbotService.estudiantes(db, estado)
            return {"respuesta": f"Encontre {len(filas)} estudiantes con estado {estado}.", "filas": filas[:50], "archivo": None}
        filas = ChatbotService.matriculas(db, estado)
        archivo = ChatbotService.crear_csv(f"matriculas-{estado}.csv", filas) if funcion.startswith("generar") else None
        return {"respuesta": f"Encontre {len(filas)} matriculas con estado {estado}.", "filas": filas[:50], "archivo": archivo}
