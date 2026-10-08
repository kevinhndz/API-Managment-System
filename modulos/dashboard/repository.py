from datetime import date

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from modulos.asignaturas.tabla import Asignaturas
from modulos.aulas.tabla import Aulas
from modulos.calificaciones.tabla import Calificaciones
from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from modulos.periodos.tabla import Periodos
from modulos.secciones.tabla import Secciones


class DashboardRepository:
    @staticmethod
    def _contar(db: Session, modelo, condicion=None) -> int:
        consulta = db.query(func.count(modelo.id))
        if condicion is not None:
            consulta = consulta.filter(condicion)
        return int(consulta.scalar() or 0)

    @staticmethod
    def resumen_repository(db: Session) -> dict:
        periodo = (
            db.query(Periodos)
            .filter(Periodos.activo.is_(True))
            .order_by(Periodos.anio.desc(), Periodos.numero.desc())
            .first()
        )
        anio = periodo.anio if periodo else date.today().year

        total_estudiantes = DashboardRepository._contar(db, Estudiantes)
        estudiantes_activos = DashboardRepository._contar(
            db, Estudiantes, Estudiantes.estado.is_(True)
        )
        docentes_activos = DashboardRepository._contar(
            db, Docentes, Docentes.estado.is_(True)
        )
        carreras_activas = DashboardRepository._contar(
            db, Carreras, Carreras.activo.is_(True)
        )
        asignaturas_total = DashboardRepository._contar(db, Asignaturas)
        periodos_total = DashboardRepository._contar(db, Periodos)

        aulas_por_edificio = (
            db.query(
                Aulas.edificio,
                func.count(Aulas.id),
                func.sum(case((Aulas.activo.is_(True), 1), else_=0)),
                func.sum(Aulas.capacidad),
            )
            .group_by(Aulas.edificio)
            .all()
        )
        capacidad_aulas = (
            db.query(Aulas.codigo, Aulas.capacidad)
            .order_by(Aulas.capacidad.desc(), Aulas.codigo)
            .limit(8)
            .all()
        )
        edificios = {
            nombre: {
                "nombre": nombre,
                "aulas_totales": int(total or 0),
                "aulas_activas": int(activas or 0),
                "capacidad": int(capacidad or 0),
                "ocupados": 0,
                "capacidad_abierta": 0,
            }
            for nombre, total, activas, capacidad in aulas_por_edificio
        }

        secciones_por_edificio = (
            db.query(
                Aulas.edificio,
                Secciones.id,
                Secciones.cupo_maximo,
                func.count(Matriculas.id),
            )
            .join(Secciones, Secciones.aula_id == Aulas.id)
            .outerjoin(
                Matriculas,
                (Matriculas.seccion_id == Secciones.id)
                & (func.upper(Matriculas.estado) == "ACTIVA"),
            )
            .filter(func.upper(Secciones.estado) == "ABIERTA")
            .group_by(Aulas.edificio, Secciones.id, Secciones.cupo_maximo)
            .all()
        )
        cupos_ocupados = 0
        capacidad_secciones_abiertas = 0
        for edificio, _, cupo_maximo, ocupados in secciones_por_edificio:
            cantidad_ocupada = int(ocupados or 0)
            capacidad = int(cupo_maximo or 0)
            cupos_ocupados += cantidad_ocupada
            capacidad_secciones_abiertas += capacidad
            edificios[edificio]["ocupados"] += cantidad_ocupada
            edificios[edificio]["capacidad_abierta"] += capacidad

        resumen_edificios = []
        for datos in edificios.values():
            capacidad_abierta = datos.pop("capacidad_abierta")
            ocupados = datos.pop("ocupados")
            datos["ocupacion"] = (
                round(ocupados * 100 / capacidad_abierta) if capacidad_abierta else None
            )
            datos["capacidad"] = capacidad_abierta
            resumen_edificios.append(datos)
        resumen_edificios.sort(
            key=lambda edificio: (-edificio["aulas_activas"], edificio["nombre"])
        )

        estados_secciones = dict(
            db.query(func.upper(Secciones.estado), func.count(Secciones.id))
            .group_by(func.upper(Secciones.estado))
            .all()
        )
        total_secciones = sum(int(cantidad) for cantidad in estados_secciones.values())
        abiertas = int(estados_secciones.get("ABIERTA", 0))
        cerradas = int(estados_secciones.get("CERRADA", 0))
        canceladas = int(estados_secciones.get("CANCELADA", 0))

        tendencia_por_mes = db.query(
            func.extract("month", Matriculas.fecha_matricula),
            func.upper(Matriculas.estado),
            func.count(Matriculas.id),
        ).filter(func.extract("year", Matriculas.fecha_matricula) == anio)
        tendencia_por_mes = tendencia_por_mes.group_by(
            func.extract("month", Matriculas.fecha_matricula),
            func.upper(Matriculas.estado),
        ).all()
        tendencia = {
            mes: {"mes": mes, "activas": 0, "canceladas": 0, "finalizadas": 0}
            for mes in range(1, 13)
        }
        for mes, estado, cantidad in tendencia_por_mes:
            mes = int(mes)
            if estado == "ACTIVA":
                tendencia[mes]["activas"] = int(cantidad)
            elif estado == "CANCELADA":
                tendencia[mes]["canceladas"] = int(cantidad)
            elif estado in {"APROBADA", "REPROBADA"}:
                tendencia[mes]["finalizadas"] += int(cantidad)

        notas_validas = (Calificaciones.nota_final >= 0) & (
            Calificaciones.nota_final <= 100
        )
        promedio = (
            db.query(func.avg(Calificaciones.nota_final)).filter(notas_validas).scalar()
        )
        calificaciones_total = DashboardRepository._contar(
            db, Calificaciones, notas_validas
        )
        matriculas_activas = DashboardRepository._contar(
            db, Matriculas, func.upper(Matriculas.estado) == "ACTIVA"
        )

        return {
            "anio": anio,
            "periodo": (
                {"anio": periodo.anio, "numero": periodo.numero} if periodo else None
            ),
            "estudiantes": {
                "total": total_estudiantes,
                "activos": estudiantes_activos,
            },
            "docentes": {"activos": docentes_activos},
            "carreras": {"activas": carreras_activas},
            "aulas": {
                "total": sum(item[1] for item in aulas_por_edificio),
                "activas": sum(item[2] or 0 for item in aulas_por_edificio),
                "capacidad_total": sum(item[3] or 0 for item in aulas_por_edificio),
            },
            "aulas_mayor_capacidad": [
                {"codigo": codigo, "capacidad": capacidad}
                for codigo, capacidad in capacidad_aulas
            ],
            "edificios": resumen_edificios,
            "secciones": {
                "total": total_secciones,
                "abiertas": abiertas,
                "cerradas": cerradas,
                "canceladas": canceladas,
                "otros_estados": total_secciones - abiertas - cerradas - canceladas,
            },
            "matriculas": {
                "activas": matriculas_activas,
                "tendencia": list(tendencia.values()),
            },
            "calificaciones": {
                "cantidad": calificaciones_total,
                "promedio": float(promedio) if promedio is not None else None,
            },
            "cupos_ocupados": cupos_ocupados,
            "capacidad_secciones_abiertas": capacidad_secciones_abiertas,
            "asignaturas_total": asignaturas_total,
            "periodos_total": periodos_total,
        }
