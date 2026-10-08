from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from database.almacen import abrir_puerta_bd, miClaseBase
from modulos.asignaturas.tabla import Asignaturas
from modulos.aulas.tabla import Aulas
from modulos.calificaciones.tabla import Calificaciones
from modulos.carreras.tabla import Carreras
from modulos.dashboard.repository import DashboardRepository
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from modulos.periodos.tabla import Periodos
from modulos.secciones.tabla import Secciones
from main import app
from utils.auth import permiso_admin


def test_resumen_dashboard_calcula_indicadores_sin_descargar_registros():
    motor = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    miClaseBase.metadata.create_all(motor)

    with Session(motor) as db:
        carrera = Carreras(
            codigo="C-DASH", nombre="Carrera dashboard", duracion_anios=4, activo=True
        )
        docente = Docentes(
            numero_empleado="D-DASH",
            nombres="Ana",
            apellidos="Lopez",
            correo="ana.dashboard@example.com",
            especialidad="General",
            estado=True,
        )
        aula = Aulas(
            codigo="A-DASH", edificio="Edificio Norte", capacidad=30, activo=True
        )
        periodo = Periodos(
            anio=2026,
            numero=1,
            fecha_inicio=date(2026, 1, 1),
            fecha_fin=date(2026, 5, 31),
            activo=True,
        )
        db.add_all([carrera, docente, aula, periodo])
        db.flush()

        estudiante_activo = Estudiantes(
            cuenta="2026-D001",
            nombre="Estudiante Activo",
            correo="activo.dashboard@example.com",
            carrera_id=carrera.id,
            estado=True,
        )
        estudiante_inactivo = Estudiantes(
            cuenta="2026-D002",
            nombre="Estudiante Inactivo",
            correo="inactivo.dashboard@example.com",
            carrera_id=carrera.id,
            estado=False,
        )
        asignatura = Asignaturas(
            codigo="MAT-DASH",
            nombre="Matematica Dashboard",
            unidades_valorativas=4,
            carrera_id=carrera.id,
            activo=True,
        )
        db.add_all([estudiante_activo, estudiante_inactivo, asignatura])
        db.flush()

        seccion_abierta = Secciones(
            codigo="MAT-DASH-A",
            asignatura_id=asignatura.id,
            docente_id=docente.id,
            periodo_id=periodo.id,
            aula_id=aula.id,
            dias="LUN",
            hora_inicio="08:00",
            hora_fin="10:00",
            cupo_maximo=20,
            estado="ABIERTA",
        )
        seccion_cerrada = Secciones(
            codigo="MAT-DASH-C",
            asignatura_id=asignatura.id,
            docente_id=docente.id,
            periodo_id=periodo.id,
            aula_id=aula.id,
            dias="MAR",
            hora_inicio="08:00",
            hora_fin="10:00",
            cupo_maximo=10,
            estado="CERRADA",
        )
        db.add_all([seccion_abierta, seccion_cerrada])
        db.flush()

        matricula_activa = Matriculas(
            estudiante_id=estudiante_activo.id,
            seccion_id=seccion_abierta.id,
            fecha_matricula=date(2026, 2, 4),
            estado="ACTIVA",
        )
        matricula_cancelada = Matriculas(
            estudiante_id=estudiante_inactivo.id,
            seccion_id=seccion_abierta.id,
            fecha_matricula=date(2026, 2, 5),
            estado="CANCELADA",
        )
        db.add_all([matricula_activa, matricula_cancelada])
        db.flush()
        db.add(
            Calificaciones(
                matricula_id=matricula_activa.id,
                primer_parcial=80,
                segundo_parcial=90,
                tercer_parcial=70,
                nota_final=80,
            )
        )
        db.commit()

        resumen = DashboardRepository.resumen_repository(db)

        assert resumen["estudiantes"] == {"total": 2, "activos": 1}
        assert resumen["docentes"]["activos"] == 1
        assert resumen["aulas"] == {"total": 1, "activas": 1, "capacidad_total": 30}
        assert resumen["secciones"]["abiertas"] == 1
        assert resumen["secciones"]["cerradas"] == 1
        assert resumen["matriculas"]["activas"] == 1
        assert resumen["matriculas"]["tendencia"][1] == {
            "mes": 2,
            "activas": 1,
            "canceladas": 1,
            "finalizadas": 0,
        }
        assert resumen["cupos_ocupados"] == 1
        assert resumen["capacidad_secciones_abiertas"] == 20
        assert resumen["calificaciones"] == {"cantidad": 1, "promedio": 80.0}

    motor.dispose()


def test_endpoint_dashboard_devuelve_resumen_protegido():
    motor = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    miClaseBase.metadata.create_all(motor)

    def abrir_base_de_prueba():
        with Session(motor) as db:
            yield db

    app.dependency_overrides[abrir_puerta_bd] = abrir_base_de_prueba
    app.dependency_overrides[permiso_admin] = lambda: {"rol": "Administrador"}

    try:
        respuesta = TestClient(app).get("/dashboard/resumen")

        assert respuesta.status_code == 200
        assert respuesta.json()["estudiantes"] == {"total": 0, "activos": 0}
        assert len(respuesta.json()["matriculas"]["tendencia"]) == 12
    finally:
        app.dependency_overrides.pop(abrir_puerta_bd, None)
        app.dependency_overrides.pop(permiso_admin, None)
        motor.dispose()
