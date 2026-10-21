from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from core.excepciones import DatosInvalidosError, RecursoDuplicadoError
from database.almacen import Instituciones, miClaseBase
from modulos.aulas.tabla import Aulas
from modulos.asignaturas.tabla import Asignaturas
from modulos.carreras.tabla import Carreras
from modulos.docentes.repository import DocenteRepository
from modulos.docentes.tabla import Docentes
from modulos.documentos.service import constancia_estudiantil, constancia_laboral
from modulos.documentos.tabla import DocumentosEmitidos
from modulos.estudiantes.tabla import Estudiantes
from modulos.finanzas.schema import CrearObligacion, RegistrarPago
from modulos.finanzas.service import crear_obligacion, listar_saldos, registrar_pago
from modulos.login.tabla import Usuarios
from modulos.matriculas.tabla import Matriculas
from modulos.periodos.tabla import Periodos
from modulos.reportes.service import ReportesService
from modulos.secciones.tabla import Secciones


@pytest.fixture
def datos():
    motor = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    miClaseBase.metadata.create_all(motor)
    db = Session(motor)
    institucion = Instituciones(slug="demo", nombre="Universidad Demo", activa=True)
    db.add(institucion)
    db.flush()
    db.info["institucion_id"] = institucion.id
    carrera = Carreras(codigo="ING", nombre="Ingenieria", duracion_anios=4, activo=True)
    docente = Docentes(numero_empleado="DOC-1", nombres="Ana", apellidos="Lopez", correo="ana@demo.edu", especialidad="Matematicas", cargo="Docente", fecha_ingreso=date(2024, 1, 1), tipo_contrato="Tiempo completo", estado=True)
    aula = Aulas(codigo="A-1", edificio="Norte", capacidad=30, activo=True)
    periodo = Periodos(anio=2026, numero=2, fecha_inicio=date(2026, 7, 1), fecha_fin=date(2026, 12, 15), activo=True)
    db.add_all([carrera, docente, aula, periodo])
    db.flush()
    estudiante = Estudiantes(cuenta="2026001", nombre="Luis Perez", correo="luis@demo.edu", carrera_id=carrera.id, estado=True)
    asignatura = Asignaturas(codigo="MAT-1", nombre="Matematicas", unidades_valorativas=4, carrera_id=carrera.id, activo=True)
    db.add_all([estudiante, asignatura])
    db.flush()
    seccion = Secciones(codigo="MAT-01", asignatura_id=asignatura.id, docente_id=docente.id, periodo_id=periodo.id, aula_id=aula.id, dias="LUN", hora_inicio="08:00", hora_fin="10:00", cupo_maximo=30, estado="ABIERTA")
    db.add(seccion)
    db.flush()
    db.add(Matriculas(estudiante_id=estudiante.id, seccion_id=seccion.id, estado="ACTIVA"))
    db.commit()
    yield db, estudiante, docente
    db.close()
    motor.dispose()


def test_constancias_previa_no_emite_folio_y_carga_docente(datos):
    db, estudiante, docente = datos
    previa_estudiante, _ = constancia_estudiantil(db, estudiante.id, 1, emitir=False)
    previa_docente, _ = constancia_laboral(db, docente.id, 1, emitir=False)
    assert previa_estudiante.startswith(b"%PDF")
    assert previa_docente.startswith(b"%PDF")
    assert db.query(DocumentosEmitidos).count() == 0
    assert DocenteRepository.carga_repository(db)[0].asignatura == "Matematicas"
    contenido, _ = constancia_estudiantil(db, estudiante.id, 1)
    assert contenido.startswith(b"%PDF")
    assert db.query(DocumentosEmitidos).count() == 1


def test_obligaciones_y_pagos_saldos_referencias(datos):
    db, estudiante, docente = datos
    obligacion = crear_obligacion(db, CrearObligacion(tipo="ESTUDIANTE", estudiante_id=estudiante.id, mes="2026-10", concepto="Mensualidad", monto=Decimal("100.00"), vence_en=date(2026, 10, 30)))
    with pytest.raises(RecursoDuplicadoError):
        crear_obligacion(db, CrearObligacion(tipo="ESTUDIANTE", estudiante_id=estudiante.id, mes="2026-10", concepto="Mensualidad", monto=Decimal("100.00"), vence_en=date(2026, 10, 30)))
    assert listar_saldos(db, "ESTUDIANTE")[0]["saldo"] == Decimal("100.00")
    registrar_pago(db, obligacion.id, RegistrarPago(referencia="TRANS-001", monto=Decimal("40.00"), fecha=date(2026, 10, 21), metodo="Transferencia"))
    assert listar_saldos(db, "ESTUDIANTE")[0]["estado"] == "PARCIAL"
    with pytest.raises(RecursoDuplicadoError):
        registrar_pago(db, obligacion.id, RegistrarPago(referencia="TRANS-001", monto=Decimal("20.00"), fecha=date(2026, 10, 21), metodo="Transferencia"))
    with pytest.raises(DatosInvalidosError):
        registrar_pago(db, obligacion.id, RegistrarPago(referencia="TRANS-002", monto=Decimal("80.00"), fecha=date(2026, 10, 21), metodo="Transferencia"))
    registrar_pago(db, obligacion.id, RegistrarPago(referencia="TRANS-003", monto=Decimal("60.00"), fecha=date(2026, 10, 21), metodo="Transferencia"))
    assert listar_saldos(db, "ESTUDIANTE")[0]["estado"] == "PAGADO"
    nomina = crear_obligacion(db, CrearObligacion(tipo="DOCENTE", docente_id=docente.id, mes="2026-10", concepto="Nomina octubre", monto=Decimal("1000.00"), vence_en=date(2026, 10, 30)))
    assert listar_saldos(db, "DOCENTE")[0]["id"] == nomina.id
    assert len(listar_saldos(db, "ESTUDIANTE")) == 1
    vista = ReportesService.vista_previa(db, "cobros_estudiantiles", {"rol": "admin"}, estado="PAGADO", mes="2026-10")
    assert vista["total_registros"] == 1
    assert vista["registros"][0]["saldo"] == 0.0
