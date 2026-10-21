from types import SimpleNamespace
from io import BytesIO

from PIL import Image

from modulos.documentos import repository as repo_documentos
from modulos.documentos.service import historial_academico
from modulos.reportes.service import ReportesService


def test_historial_previo_no_registra_emision(monkeypatch):
    monkeypatch.setattr(repo_documentos, "buscar_institucion", lambda db, id: SimpleNamespace(id=1, slug="uphn", nombre="Universidad de prueba"))
    monkeypatch.setattr(repo_documentos, "buscar_estudiante", lambda db, id, institucion: SimpleNamespace(id=7, nombre="Ana Prueba", cuenta="2026-0007", carrera_id=3))
    monkeypatch.setattr(repo_documentos, "buscar_carrera", lambda db, id, institucion: SimpleNamespace(nombre="Ingenieria"))
    monkeypatch.setattr(repo_documentos, "listar_calificaciones", lambda db, estudiante, institucion: [])
    monkeypatch.setattr(repo_documentos, "leer_logo", lambda db, institucion: None)
    guardados = []
    monkeypatch.setattr(repo_documentos, "guardar_emision", lambda *args: guardados.append(args))

    contenido, nombre = historial_academico(SimpleNamespace(info={"institucion_id": 1}), 7, 9, emitir=False)

    assert contenido.startswith(b"%PDF")
    assert nombre.endswith("vista_previa.pdf")
    assert guardados == []


def test_vistas_de_archivo_no_registran_descarga(monkeypatch):
    registros = [SimpleNamespace(cuenta="2026-0007", nombre="Ana Prueba", correo="ana@prueba.test", carrera="Ingenieria", estado=True)]
    monkeypatch.setattr(ReportesService, "consultar_registros", staticmethod(lambda *args, **kwargs: registros))

    excel = ReportesService.previsualizar_archivo(None, "estudiantes", "xlsx", {"rol": "Administrador"})
    csv = ReportesService.previsualizar_archivo(None, "estudiantes", "csv", {"rol": "Administrador"})
    json = ReportesService.previsualizar_archivo(None, "estudiantes", "json", {"rol": "Administrador"})

    assert b"Ana Prueba" in excel.body
    assert b"Ana Prueba" in csv.body
    assert b"Ana Prueba" in json.body
    assert excel.headers["cache-control"] == "no-store"
    assert csv.headers["content-disposition"] == "inline"


def test_historial_muestra_logo_configurado(monkeypatch):
    imagen = BytesIO()
    Image.new("RGB", (180, 80), "#5b0309").save(imagen, format="PNG")
    monkeypatch.setattr(repo_documentos, "buscar_institucion", lambda db, id: SimpleNamespace(id=1, slug="uphn", nombre="Universidad de prueba"))
    monkeypatch.setattr(repo_documentos, "buscar_estudiante", lambda db, id, institucion: SimpleNamespace(id=7, nombre="Ana Prueba", cuenta="2026-0007", carrera_id=3))
    monkeypatch.setattr(repo_documentos, "buscar_carrera", lambda db, id, institucion: SimpleNamespace(nombre="Ingenieria"))
    monkeypatch.setattr(repo_documentos, "listar_calificaciones", lambda db, estudiante, institucion: [])
    monkeypatch.setattr(repo_documentos, "leer_logo", lambda db, institucion: imagen.getvalue())

    contenido, _ = historial_academico(SimpleNamespace(info={"institucion_id": 1}), 7, 9, emitir=False)

    assert contenido.startswith(b"%PDF")
    assert len(contenido) > 2500
