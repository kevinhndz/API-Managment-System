import json
import requests
from pathlib import Path
from sqlalchemy.orm import Session
from openpyxl import Workbook

from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from core.config import settings


# Esta carpeta guarda temporalmente reportes generados por el chatbot.
REPORTES_DIR = Path("reportes_generados")


class ChatbotService:
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

    # Describe las herramientas para que el modelo elija la funcion correcta.
    @staticmethod
    def herramientas() -> list[dict]:
        return [{"type": "function", "function": {"name": "listar_docentes", "description": "Lista docentes por estado activo, inactivo o todos.", "parameters": {"type": "object", "properties": {"estado": {"type": "string", "enum": ["activo", "inactivo", "todos"]}}, "required": ["estado"]}}}, {"type": "function", "function": {"name": "listar_estudiantes", "description": "Lista estudiantes por estado activo, inactivo o todos.", "parameters": {"type": "object", "properties": {"estado": {"type": "string", "enum": ["activo", "inactivo", "todos"]}}, "required": ["estado"]}}}, {"type": "function", "function": {"name": "listar_matriculas", "description": "Lista matriculas por estado activa, cancelada o todos.", "parameters": {"type": "object", "properties": {"estado": {"type": "string", "enum": ["activa", "cancelada", "todos"]}}, "required": ["estado"]}}}, {"type": "function", "function": {"name": "generar_excel_docentes", "description": "Genera un Excel descargable con docentes filtrados por estado.", "parameters": {"type": "object", "properties": {"estado": {"type": "string", "enum": ["activo", "inactivo", "todos"]}}, "required": ["estado"]}}}, {"type": "function", "function": {"name": "generar_excel_matriculas", "description": "Genera un Excel descargable con matriculas filtradas por estado.", "parameters": {"type": "object", "properties": {"estado": {"type": "string", "enum": ["activa", "cancelada", "todos"]}}, "required": ["estado"]}}}]

    # Ejecuta una herramienta solicitada por el modelo local.
    @staticmethod
    def ejecutar_herramienta(db: Session, nombre: str, argumentos: dict) -> dict:
        estado = argumentos.get("estado", "todos")
        if nombre in {"listar_docentes", "generar_excel_docentes"}:
            filas = ChatbotService.docentes(db, estado)
        elif nombre in {"listar_estudiantes"}:
            filas = ChatbotService.estudiantes(db, estado)
        elif nombre in {"listar_matriculas", "generar_excel_matriculas"}:
            filas = ChatbotService.matriculas(db, estado)
        else:
            return {"error": "Herramienta no permitida"}
        archivo = ChatbotService.crear_csv(f"{nombre}-{estado}.xlsx", filas) if nombre.startswith("generar") else None
        return {"total": len(filas), "filas": filas[:100], "archivo": archivo}

    # Envia el mensaje al modelo y ejecuta las herramientas que el modelo solicite.
    @staticmethod
    def responder(db: Session, mensaje: str) -> dict:
        mensajes = [{"role": "system", "content": "Eres el asistente de CampusFlow. Responde en espanol claro, no inventes datos y usa herramientas cuando la consulta pida informacion del sistema o reportes."}, {"role": "user", "content": mensaje}]
        for _ in range(3):
            respuesta = requests.post(f"{settings.OLLAMA_URL}/api/chat", json={"model": settings.OLLAMA_MODEL, "messages": mensajes, "tools": ChatbotService.herramientas(), "stream": False}, timeout=90)
            respuesta.raise_for_status()
            mensaje_modelo = respuesta.json().get("message", {})
            llamadas = mensaje_modelo.get("tool_calls", [])
            mensajes.append(mensaje_modelo)
            if not llamadas:
                return {"respuesta": mensaje_modelo.get("content", "No pude generar una respuesta."), "filas": [], "archivo": None}
            ultimo = {"filas": [], "archivo": None}
            for llamada in llamadas:
                nombre = llamada["function"]["name"]
                argumentos = llamada["function"].get("arguments", {})
                resultado = ChatbotService.ejecutar_herramienta(db, nombre, argumentos)
                ultimo = resultado
                mensajes.append({"role": "tool", "content": json.dumps(resultado, ensure_ascii=False), "tool_name": nombre})
        return {"respuesta": "El modelo no termino la consulta.", "filas": ultimo.get("filas", []), "archivo": ultimo.get("archivo")}
