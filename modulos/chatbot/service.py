import json
import re
import requests
from pathlib import Path
from sqlalchemy.orm import Session
from openpyxl import Workbook

from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from modulos.calificaciones.tabla import Calificaciones
from core.config import settings


# Esta carpeta guarda temporalmente reportes generados por el chatbot.
REPORTES_DIR = Path("reportes_generados")


class ChatbotService:
    # Recupera consultas claras cuando el modelo pequeno responde solo con texto.
    @staticmethod
    def respaldo_consulta(db: Session, mensaje: str) -> dict | None:
        texto = mensaje.lower()
        reporte = any(palabra in texto for palabra in ["excel", "reporte", "archivo", "descarga"])
        estado_docente = "inactivo" if any(palabra in texto for palabra in ["inactivo", "desactivado", "no trabaja"]) else "activo" if "activo" in texto else "todos"
        if any(palabra in texto for palabra in ["docente", "profesor", "maestro", "empleado"]):
            codigo = re.search(r"doc[- ]?\d+", texto)
            if codigo:
                resultado = ChatbotService.ejecutar_herramienta(db, "buscar_registros", {"modulo": "docentes", "termino": codigo.group(0).replace(" ", "-")})
            else:
                resultado = ChatbotService.ejecutar_herramienta(db, "generar_excel_docentes" if reporte else "listar_docentes", {"estado": estado_docente})
            return {"respuesta": f"Encontre {resultado.get('total', 0)} registros de docentes.", "filas": resultado.get("filas", []), "archivo": resultado.get("archivo")}
        if any(palabra in texto for palabra in ["estudiante", "alumno", "cuenta"]):
            cuenta = re.search(r"\b\d{4}[- ]\d{4}\b", texto)
            if cuenta:
                resultado = ChatbotService.ejecutar_herramienta(db, "buscar_registros", {"modulo": "estudiantes", "termino": cuenta.group(0).replace(" ", "-")})
            else:
                resultado = ChatbotService.ejecutar_herramienta(db, "listar_estudiantes", {"estado": estado_docente})
            return {"respuesta": f"Encontre {resultado.get('total', 0)} registros de estudiantes.", "filas": resultado.get("filas", []), "archivo": resultado.get("archivo")}
        if any(palabra in texto for palabra in ["calificacion", "calificación", "nota", "notas"]):
            termino = texto
            for palabra in ["calificaciones", "calificacion", "calificación", "nota final", "notas", "nota"]:
                termino = termino.replace(palabra, "")
            filas = ChatbotService.calificaciones(db, termino.strip())
            return {"respuesta": f"Encontre {len(filas)} calificaciones.", "filas": filas[:100], "archivo": None}
        if "matricula" in texto or "inscripcion" in texto:
            estado = "cancelada" if "cancel" in texto else "activa" if "activa" in texto else "todos"
            resultado = ChatbotService.ejecutar_herramienta(db, "generar_excel_matriculas" if reporte else "listar_matriculas", {"estado": estado})
            return {"respuesta": f"Encontre {resultado.get('total', 0)} matriculas.", "filas": resultado.get("filas", []), "archivo": resultado.get("archivo")}
        return None
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

    # Busca calificaciones por nombre, cuenta o identificador relacionado.
    @staticmethod
    def calificaciones(db: Session, termino: str = "") -> list[dict]:
        consulta = db.query(Calificaciones, Matriculas, Estudiantes).join(Matriculas, Calificaciones.matricula_id == Matriculas.id).join(Estudiantes, Matriculas.estudiante_id == Estudiantes.id)
        filas = []
        for calificacion, matricula, estudiante in consulta.all():
            texto = f"{calificacion.id} {matricula.id} {estudiante.id} {estudiante.nombre} {estudiante.cuenta}".lower()
            if termino.strip() and termino.lower() not in texto:
                continue
            filas.append({"calificacion_id": calificacion.id, "estudiante": estudiante.nombre, "cuenta": estudiante.cuenta, "matricula_id": matricula.id, "primer_parcial": float(calificacion.primer_parcial), "segundo_parcial": float(calificacion.segundo_parcial), "tercer_parcial": float(calificacion.tercer_parcial), "nota_final": float(calificacion.nota_final), "observacion": calificacion.observacion or ""})
        return filas

    # Busca identificadores y nombres en los registros permitidos para lectura.
    @staticmethod
    def buscar(db: Session, modulo: str, termino: str) -> list[dict]:
        texto = termino.strip()
        if modulo == "docentes":
            filas = ChatbotService.docentes(db, "todos")
        elif modulo == "estudiantes":
            filas = ChatbotService.estudiantes(db, "todos")
        elif modulo == "matriculas":
            filas = ChatbotService.matriculas(db, "todos")
        else:
            return []
        return [fila for fila in filas if texto.lower() in " ".join(str(valor) for valor in fila.values()).lower()]

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
        def herramienta(nombre: str, descripcion: str, propiedades: dict, requeridos: list[str]) -> dict:
            return {"type": "function", "function": {"name": nombre, "description": descripcion, "parameters": {"type": "object", "properties": propiedades, "required": requeridos}}}
        estado_docente = {"estado": {"type": "string", "enum": ["activo", "inactivo", "todos"]}}
        estado_matricula = {"estado": {"type": "string", "enum": ["activa", "cancelada", "todos"]}}
        return [herramienta("listar_docentes", "Lista docentes por estado.", estado_docente, ["estado"]), herramienta("listar_estudiantes", "Lista estudiantes por estado.", estado_docente, ["estado"]), herramienta("listar_matriculas", "Lista matriculas por estado.", estado_matricula, ["estado"]), herramienta("buscar_calificaciones", "Busca notas por nombre, cuenta, estudiante o matricula.", {"termino": {"type": "string"}}, ["termino"]), herramienta("buscar_registros", "Busca registros por codigo, cuenta, nombre o id.", {"modulo": {"type": "string", "enum": ["docentes", "estudiantes", "matriculas"]}, "termino": {"type": "string"}}, ["modulo", "termino"]), herramienta("generar_excel_docentes", "Genera Excel de docentes.", estado_docente, ["estado"]), herramienta("generar_excel_matriculas", "Genera Excel de matriculas.", estado_matricula, ["estado"])]

    # Ejecuta una herramienta solicitada por el modelo local.
    @staticmethod
    def ejecutar_herramienta(db: Session, nombre: str, argumentos: dict) -> dict:
        estado = argumentos.get("estado", "todos")
        if nombre == "buscar_calificaciones":
            filas = ChatbotService.calificaciones(db, argumentos.get("termino", ""))
        elif nombre == "buscar_registros":
            filas = ChatbotService.buscar(db, argumentos.get("modulo", "estudiantes"), argumentos.get("termino", ""))
        elif nombre in {"listar_docentes", "generar_excel_docentes"}:
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
        mensajes = [{"role": "system", "content": "Eres el asistente interno de CampusFlow. La informacion del sistema puede consultarse libremente por el usuario autorizado: no respondas con advertencias de privacidad. Usa buscar_registros para codigos, cuentas, nombres o ids. Usa las herramientas para datos reales y reportes. Solo estan prohibidas editar y eliminar. Responde en espanol claro y resume los resultados."}, {"role": "user", "content": mensaje}]
        for _ in range(3):
            respuesta = requests.post(f"{settings.OLLAMA_URL}/api/chat", json={"model": settings.OLLAMA_MODEL, "messages": mensajes, "tools": ChatbotService.herramientas(), "stream": False}, timeout=90)
            respuesta.raise_for_status()
            mensaje_modelo = respuesta.json().get("message", {})
            llamadas = mensaje_modelo.get("tool_calls", [])
            mensajes.append(mensaje_modelo)
            if not llamadas:
                respaldo = ChatbotService.respaldo_consulta(db, mensaje)
                if respaldo:
                    return respaldo
                return {"respuesta": mensaje_modelo.get("content", "No pude generar una respuesta."), "filas": [], "archivo": None}
            ultimo = {"filas": [], "archivo": None}
            for llamada in llamadas:
                nombre = llamada["function"]["name"]
                argumentos = llamada["function"].get("arguments", {})
                resultado = ChatbotService.ejecutar_herramienta(db, nombre, argumentos)
                ultimo = resultado
                mensajes.append({"role": "tool", "content": json.dumps(resultado, ensure_ascii=False), "tool_name": nombre})
        return {"respuesta": "El modelo no termino la consulta.", "filas": ultimo.get("filas", []), "archivo": ultimo.get("archivo")}
