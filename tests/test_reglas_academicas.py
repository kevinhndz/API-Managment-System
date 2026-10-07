from datetime import date

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from database.almacen import miClaseBase
from modulos.auditoria.tabla import EventoAuditoria
from modulos.aulas.tabla import Aulas
from modulos.asignaturas.tabla import Asignaturas
from modulos.calificaciones.schema import (
    Editar_Parcialmente_Calificacion,
    Revisar_Json_Crear_Calificacion,
    Revisar_Json_Editar_Calificacion,
)
from modulos.calificaciones.service import CalificacionesService
from modulos.calificaciones.tabla import Calificaciones
from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.schema import (
    Editar_Parcialmente_Matricula,
    Revisar_Json_Crear_Matricula,
    Revisar_Json_Editar_Matricula,
)
from modulos.matriculas.service import MatriculasService
from modulos.matriculas.tabla import Matriculas
from modulos.periodos.tabla import Periodos
from modulos.secciones.schema import (
    Editar_Parcialmente_Seccion,
    Revisar_Json_Crear_Seccion,
    Revisar_Json_Editar_Seccion,
)
from modulos.secciones.service import SeccionesService
from modulos.secciones.tabla import Secciones


@pytest.fixture
def base_academica():
    motor = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    miClaseBase.metadata.create_all(motor)
    db = Session(motor)

    carrera = Carreras(
        codigo="ING-01", nombre="Ingenieria", duracion_anios=4, activo=True
    )
    docente = Docentes(
        numero_empleado="DOC-01",
        nombres="Ana",
        apellidos="Lopez",
        correo="ana@example.com",
        especialidad="Matematicas",
        estado=True,
    )
    aula = Aulas(codigo="A-01", edificio="Norte", capacidad=30, activo=True)
    periodo = Periodos(
        anio=2026,
        numero=1,
        fecha_inicio=date(2026, 1, 1),
        fecha_fin=date(2026, 12, 31),
        activo=True,
    )
    db.add_all([carrera, docente, aula, periodo])
    db.flush()

    estudiantes = [
        Estudiantes(
            cuenta=f"2026-{indice:04d}",
            nombre=f"Estudiante {indice}",
            correo=f"estudiante{indice}@example.com",
            carrera_id=carrera.id,
            estado=True,
        )
        for indice in range(1, 4)
    ]
    asignaturas = [
        Asignaturas(
            codigo=f"MAT-{indice}",
            nombre=f"Matematicas {indice}",
            unidades_valorativas=4,
            carrera_id=carrera.id,
            activo=True,
        )
        for indice in range(1, 4)
    ]
    db.add_all([*estudiantes, *asignaturas])
    db.flush()

    seccion = Secciones(
        codigo="MAT-01",
        asignatura_id=asignaturas[0].id,
        docente_id=docente.id,
        periodo_id=periodo.id,
        aula_id=aula.id,
        dias="LUN-MIE",
        hora_inicio="08:00",
        hora_fin="10:00",
        cupo_maximo=2,
        estado="ABIERTA",
    )
    db.add(seccion)
    db.commit()

    yield {
        "db": db,
        "aula": aula,
        "docente": docente,
        "periodo": periodo,
        "estudiantes": estudiantes,
        "asignaturas": asignaturas,
        "seccion": seccion,
    }

    db.close()
    motor.dispose()


def datos_seccion(base, codigo, **cambios):
    valores = {
        "codigo": codigo,
        "asignatura_id": base["asignaturas"][1].id,
        "docente_id": base["docente"].id,
        "periodo_id": base["periodo"].id,
        "aula_id": base["aula"].id,
        "dias": "MAR-JUE",
        "hora_inicio": "10:00",
        "hora_fin": "12:00",
        "cupo_maximo": 20,
        "estado": "ABIERTA",
    }
    valores.update(cambios)
    return valores


def nueva_matricula(base, estudiante_indice=0, seccion_id=None):
    return MatriculasService.crear_service(
        base["db"],
        Revisar_Json_Crear_Matricula(
            estudiante_id=base["estudiantes"][estudiante_indice].id,
            seccion_id=seccion_id or base["seccion"].id,
            fecha_matricula=date(2026, 2, 1),
        ),
    )


def test_matricula_rechaza_duplicado_y_edicion_con_referencia_invalida(base_academica):
    base = base_academica
    matricula = nueva_matricula(base)

    with pytest.raises(RecursoDuplicadoError, match="ya esta matriculado"):
        nueva_matricula(base)

    with pytest.raises(RecursoNoEncontradoError, match="No existe esta seccion"):
        MatriculasService.editar_service(
            base["db"],
            matricula.id,
            Revisar_Json_Editar_Matricula(
                estudiante_id=base["estudiantes"][0].id,
                seccion_id=999,
                fecha_matricula=date(2026, 2, 1),
                estado="ACTIVA",
            ),
        )


def test_matricula_no_permite_reducir_cupo_por_debajo_de_las_activas(base_academica):
    base = base_academica
    nueva_matricula(base)
    nueva_matricula(base, estudiante_indice=1)

    with pytest.raises(RecursoDuplicadoError, match="cupo no puede ser menor"):
        SeccionesService.editar_parcialmente_service(
            base["db"],
            base["seccion"].id,
            Editar_Parcialmente_Seccion(cupo_maximo=1),
        )


def test_matricula_no_permite_editar_a_una_seccion_ya_matriculada(base_academica):
    base = base_academica
    otra = SeccionesService.crear_service(
        base["db"], Revisar_Json_Crear_Seccion(**datos_seccion(base, "MAT-02"))
    )
    primera = nueva_matricula(base, seccion_id=base["seccion"].id)
    nueva_matricula(base, seccion_id=otra.id)

    with pytest.raises(RecursoDuplicadoError, match="ya esta matriculado"):
        MatriculasService.editar_service(
            base["db"],
            primera.id,
            Revisar_Json_Editar_Matricula(
                estudiante_id=base["estudiantes"][0].id,
                seccion_id=otra.id,
                fecha_matricula=date(2026, 2, 1),
                estado="ACTIVA",
            ),
        )


def test_seccion_rechaza_choque_al_crear_y_actualizar(base_academica):
    base = base_academica
    conflicto = datos_seccion(
        base,
        "MAT-02",
        dias="MIERCOLES-VIERNES",
        hora_inicio="09:00",
        hora_fin="11:00",
        aula_id=999,
    )
    with pytest.raises(RecursoNoEncontradoError, match="No existe esta aula"):
        SeccionesService.crear_service(
            base["db"], Revisar_Json_Crear_Seccion(**conflicto)
        )

    otra_aula = Aulas(codigo="A-02", edificio="Sur", capacidad=25, activo=True)
    base["db"].add(otra_aula)
    base["db"].commit()
    conflicto["aula_id"] = otra_aula.id
    with pytest.raises(RecursoDuplicadoError, match="choque de horario"):
        SeccionesService.crear_service(
            base["db"], Revisar_Json_Crear_Seccion(**conflicto)
        )

    seccion = SeccionesService.crear_service(
        base["db"], Revisar_Json_Crear_Seccion(**datos_seccion(base, "MAT-03"))
    )
    with pytest.raises(RecursoDuplicadoError, match="choque de horario"):
        SeccionesService.editar_service(
            base["db"],
            seccion.id,
            Revisar_Json_Editar_Seccion(
                **datos_seccion(
                    base,
                    "MAT-03",
                    dias="LUNES-MIERCOLES",
                    hora_inicio="09:00",
                    hora_fin="11:00",
                    aula_id=otra_aula.id,
                )
            ),
        )


def test_seccion_parcial_valida_horario_combinado(base_academica):
    base = base_academica
    otra_aula = Aulas(codigo="A-02", edificio="Sur", capacidad=25, activo=True)
    base["db"].add(otra_aula)
    base["db"].commit()
    seccion = SeccionesService.crear_service(
        base["db"], Revisar_Json_Crear_Seccion(**datos_seccion(base, "MAT-02", aula_id=otra_aula.id))
    )

    with pytest.raises(RecursoDuplicadoError, match="choque de horario"):
        SeccionesService.editar_parcialmente_service(
            base["db"],
            seccion.id,
            Editar_Parcialmente_Seccion(
                dias="LUNES-MIERCOLES",
                hora_inicio="09:00",
                hora_fin="11:00",
            ),
        )


def test_seccion_rechaza_dias_y_horas_invalidos():
    with pytest.raises(ValidationError):
        Revisar_Json_Crear_Seccion(
            codigo="MAT-X",
            asignatura_id=1,
            docente_id=1,
            periodo_id=1,
            aula_id=1,
            dias="LUN-XYZ",
            hora_inicio="08:00",
            hora_fin="10:00",
            cupo_maximo=20,
        )

    with pytest.raises(ValidationError):
        Revisar_Json_Crear_Seccion(
            codigo="MAT-X",
            asignatura_id=1,
            docente_id=1,
            periodo_id=1,
            aula_id=1,
            dias="LUN-MIE",
            hora_inicio="10:00",
            hora_fin="08:00",
            cupo_maximo=20,
        )


@pytest.mark.parametrize(
    ("edicion", "nota_final", "estado_esperado"),
    [
        ("completa", 40, "REPROBADA"),
        ("parcial", 90, "APROBADA"),
    ],
)
def test_editar_calificacion_sincroniza_estado_de_matricula(
    base_academica, edicion, nota_final, estado_esperado
):
    base = base_academica
    matricula = nueva_matricula(base)
    calificacion = CalificacionesService.crear_service(
        base["db"],
        Revisar_Json_Crear_Calificacion(
            matricula_id=matricula.id,
            primer_parcial=80,
            segundo_parcial=80,
            tercer_parcial=80,
        ),
    )

    if edicion == "completa":
        CalificacionesService.editar_service(
            base["db"],
            calificacion.id,
            Revisar_Json_Editar_Calificacion(
                matricula_id=matricula.id,
                primer_parcial=40,
                segundo_parcial=40,
                tercer_parcial=40,
            ),
        )
    else:
        CalificacionesService.editar_parcialmente_service(
            base["db"],
            calificacion.id,
            Editar_Parcialmente_Calificacion(
                primer_parcial=90,
                segundo_parcial=90,
                tercer_parcial=90,
            ),
        )

    base["db"].refresh(matricula)
    assert matricula.estado == estado_esperado
