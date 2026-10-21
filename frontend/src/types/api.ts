export interface PaginatedResponse<T> {
  total: number
  pagina_actual: number
  limite: number
  total_paginas: number
  data: T[]
}

export interface PaginationParams {
  pagina_actual?: number
  limite?: number
  busqueda?: string
}

export interface Aula {
  id: number
  codigo: string
  edificio: 'Edificio Norte' | 'Edificio Sur' | 'Edificio UPH'
  capacidad: number
  activo: boolean
  created_at?: string
  updated_at?: string
}

export type AulaPayload = Omit<Aula, 'id' | 'created_at' | 'updated_at'>

export interface Docente {
  id: number
  numero_empleado: string
  nombres: string
  apellidos: string
  foto: string | null
  correo: string
  especialidad: string
  cargo: string | null
  departamento: string | null
  tipo_contrato: string | null
  fecha_ingreso: string | null
  estado: boolean
}

export type DocentePayload = Omit<Docente, 'id' | 'foto'>

export interface Carrera {
  id: number
  codigo: string
  nombre: string
  duracion_anios: number
  activo: boolean
}

export type CarreraPayload = Omit<Carrera, 'id'>

export interface Estudiante { id: number; cuenta: string; nombre: string; foto: string | null; correo: string; telefono?: string | null; fechaNacimiento: string; carrera_id: number; estado: boolean }
export type EstudiantePayload = Omit<Estudiante, 'id' | 'foto'>
export interface Asignatura { id: number; codigo: string; nombre: string; unidades_valorativas: number; carrera_id: number; requisito_id?: number | null; activo: boolean }
export type AsignaturaPayload = Omit<Asignatura, 'id'>
export interface Periodo { id: number; anio: number; numero: number; fecha_inicio: string; fecha_fin: string; activo: boolean }
export type PeriodoPayload = Omit<Periodo, 'id'>
export interface Seccion { id: number; codigo: string; asignatura_id: number; docente_id: number; periodo_id: number; aula_id: number; dias: string; hora_inicio: string; hora_fin: string; cupo_maximo: number; estado: string }
export type SeccionPayload = Omit<Seccion, 'id'>
export interface Matricula { id: number; estudiante_id: number; seccion_id: number; fecha_matricula: string; estado: string }
export type MatriculaPayload = Omit<Matricula, 'id'>
// Pydantic serializes Decimal values as strings (for example, "60.00").
export interface Calificacion { id: number; matricula_id: number; primer_parcial: number | string; segundo_parcial: number | string; tercer_parcial: number | string; nota_final: number | string; observacion?: string | null }
export interface CalificacionPayload { matricula_id: number; primer_parcial: number; segundo_parcial: number; tercer_parcial: number; observacion?: string | null }

export interface DashboardData {
  aulas: Aula[]
  docentes: Docente[]
  carreras: Carrera[]
  estudiantes: Estudiante[]
  asignaturas: Asignatura[]
  periodos: Periodo[]
  secciones: Seccion[]
  matriculas: Matricula[]
  calificaciones: Calificacion[]
}

export interface DashboardResumen {
  anio: number
  periodo: { anio: number; numero: number } | null
  estudiantes: { total: number; activos: number }
  docentes: { activos: number }
  carreras: { activas: number }
  aulas: { total: number; activas: number; capacidad_total: number }
  aulas_mayor_capacidad: { codigo: string; capacidad: number }[]
  edificios: { nombre: string; aulas_activas: number; aulas_totales: number; ocupacion: number | null; capacidad: number }[]
  secciones: { total: number; abiertas: number; cerradas: number; canceladas: number; otros_estados: number }
  matriculas: { activas: number; tendencia: { mes: number; activas: number; canceladas: number; finalizadas: number }[] }
  calificaciones: { cantidad: number; promedio: number | null }
  cupos_ocupados: number
  capacidad_secciones_abiertas: number
  asignaturas_total: number
  periodos_total: number
}
