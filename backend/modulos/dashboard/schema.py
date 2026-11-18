from pydantic import BaseModel


class PeriodoActual(BaseModel):
    anio: int
    numero: int


class IndicadoresEstudiantes(BaseModel):
    total: int
    activos: int


class IndicadoresDocentes(BaseModel):
    activos: int


class IndicadoresCarreras(BaseModel):
    activas: int


class IndicadoresAulas(BaseModel):
    total: int
    activas: int
    capacidad_total: int


class AulaCapacidad(BaseModel):
    codigo: str
    capacidad: int


class EdificioResumen(BaseModel):
    nombre: str
    aulas_activas: int
    aulas_totales: int
    ocupacion: int | None
    capacidad: int


class IndicadoresSecciones(BaseModel):
    total: int
    abiertas: int
    cerradas: int
    canceladas: int
    otros_estados: int


class TendenciaMatriculas(BaseModel):
    mes: int
    activas: int
    canceladas: int
    finalizadas: int


class IndicadoresMatriculas(BaseModel):
    activas: int
    tendencia: list[TendenciaMatriculas]


class IndicadoresCalificaciones(BaseModel):
    cantidad: int
    promedio: float | None


class DashboardResumen(BaseModel):
    anio: int
    periodo: PeriodoActual | None
    estudiantes: IndicadoresEstudiantes
    docentes: IndicadoresDocentes
    carreras: IndicadoresCarreras
    aulas: IndicadoresAulas
    aulas_mayor_capacidad: list[AulaCapacidad]
    edificios: list[EdificioResumen]
    secciones: IndicadoresSecciones
    matriculas: IndicadoresMatriculas
    calificaciones: IndicadoresCalificaciones
    cupos_ocupados: int
    capacidad_secciones_abiertas: int
    asignaturas_total: int
    periodos_total: int
