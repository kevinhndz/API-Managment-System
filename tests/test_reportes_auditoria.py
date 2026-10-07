from io import BytesIO
import asyncio
from datetime import date
from types import SimpleNamespace

from openpyxl import load_workbook
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database.almacen import miClaseBase
from modulos.auditoria.registro import usuario_actual
from modulos.auditoria.tabla import EventoAuditoria
from modulos.login.tabla import Usuarios
from modulos.aulas.tabla import Aulas
from modulos.asignaturas.tabla import Asignaturas
from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from modulos.periodos.tabla import Periodos
from modulos.secciones.tabla import Secciones
from modulos.reportes.exportadores import exportar_excel, exportar_pdf
from modulos.reportes.repository import ReportesRepository
from database.almacen import abrir_puerta_bd
from main import app
from utils.token import crear_token


def test_auditoria_registra_creacion_edicion_y_eliminacion():
    motor = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Aulas.__table__.create(motor)
    EventoAuditoria.__table__.create(motor)
    contexto = usuario_actual.set({"user_id": 7, "user": "admin"})

    try:
        with Session(motor) as db:
            aula = Aulas(codigo="PRUEBA-01", edificio="Edificio Norte", capacidad=30, activo=True)
            db.add(aula)
            db.commit()
            aula.capacidad = 35
            db.commit()
            db.delete(aula)
            db.commit()

            eventos = db.scalars(select(EventoAuditoria).order_by(EventoAuditoria.id)).all()
            assert [evento.accion for evento in eventos] == ["CREAR", "EDITAR", "ELIMINAR"]
            assert all(evento.usuario == "admin" and evento.registro_id == aula.id for evento in eventos)
    finally:
        usuario_actual.reset(contexto)
        motor.dispose()


def test_exportaciones_generan_archivos_reales():
    registros = [SimpleNamespace(cuenta="2026-0001", nombre="Ana & Maria", correo="ana@example.com", carrera="Ingenieria", estado=True)]

    excel = exportar_excel("estudiantes", registros)
    libro = load_workbook(BytesIO(asyncio.run(leer_respuesta(excel))))
    assert libro.active["B2"].value == "Ana & Maria"

    pdf = exportar_pdf("estudiantes", registros)
    assert asyncio.run(leer_respuesta(pdf)).startswith(b"%PDF")


async def leer_respuesta(respuesta):
    partes = []
    async for parte in respuesta.body_iterator:
        partes.append(parte)
    return b"".join(partes)


def test_filtros_de_matriculas_y_secciones():
    motor = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    miClaseBase.metadata.create_all(motor)

    with Session(motor) as db:
        carrera = Carreras(codigo="C-1", nombre="Ingenieria", duracion_anios=4, activo=True)
        docente = Docentes(numero_empleado="D-1", nombres="Ana", apellidos="Lopez", correo="ana@example.com", especialidad="Matematicas", estado=True)
        aula = Aulas(codigo="A-1", edificio="Edificio Norte", capacidad=30, activo=True)
        periodo = Periodos(anio=2026, numero=1, fecha_inicio=date(2026, 1, 1), fecha_fin=date(2026, 5, 31), activo=True)
        db.add_all([carrera, docente, aula, periodo])
        db.flush()

        estudiante = Estudiantes(cuenta="2026-0001", nombre="Maria Lopez", correo="maria@example.com", carrera_id=carrera.id, estado=True)
        asignatura = Asignaturas(codigo="MAT-1", nombre="Matematicas", unidades_valorativas=4, carrera_id=carrera.id, activo=True)
        db.add_all([estudiante, asignatura])
        db.flush()

        seccion = Secciones(codigo="MAT-01", asignatura_id=asignatura.id, docente_id=docente.id, periodo_id=periodo.id, aula_id=aula.id, dias="LUN", hora_inicio="08:00", hora_fin="10:00", cupo_maximo=30, estado="CERRADA")
        db.add(seccion)
        db.flush()
        db.add(Matriculas(estudiante_id=estudiante.id, seccion_id=seccion.id, fecha_matricula=date(2026, 2, 1), estado="CANCELADA"))
        db.commit()

        assert len(ReportesRepository.matriculas_repository(db, estado="CANCELADA", carrera_id=carrera.id, desde=date(2026, 1, 1), hasta=date(2026, 3, 1))) == 1
        assert ReportesRepository.matriculas_repository(db, estado="ACTIVA") == []
        assert len(ReportesRepository.secciones_repository(db, estado="CERRADA", periodo_id=periodo.id)) == 1
        assert ReportesRepository.secciones_repository(db, estado="ABIERTA") == []

    motor.dispose()


def test_peticion_autenticada_registra_actividad():
    motor = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Aulas.__table__.create(motor)
    EventoAuditoria.__table__.create(motor)
    Usuarios.__table__.create(motor)

    with Session(motor) as db:
        db.add(Usuarios(id=7, usuario="admin", contrasena="hash", rol="Administrador", activo=True))
        db.commit()

    def base_de_prueba():
        with Session(motor) as db:
            yield db

    app.dependency_overrides[abrir_puerta_bd] = base_de_prueba
    token = crear_token("admin", 7, "Administrador")

    try:
        with TestClient(app) as cliente:
            respuesta = cliente.post("/aulas/", json={"codigo": "A-99", "edificio": "Edificio Norte", "capacidad": 30, "activo": True}, headers={"Authorization": f"Bearer {token}"})
            assert respuesta.status_code == 201, respuesta.text

            actividad = cliente.get("/auditoria/", headers={"Authorization": f"Bearer {token}"})
            assert actividad.status_code == 200
            assert actividad.json()[0]["modulo"] == "aulas"
            assert actividad.json()[0]["usuario"] == "admin"
    finally:
        app.dependency_overrides.clear()
        motor.dispose()
