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
  correo: string
  especialidad: string
  estado: boolean
}

export type DocentePayload = Omit<Docente, 'id'>

export interface Carrera {
  id: number
  codigo: string
  nombre: string
  duracion_anios: number
  activo: boolean
}

export type CarreraPayload = Omit<Carrera, 'id'>

export interface DashboardData {
  aulas: Aula[]
  docentes: Docente[]
  carreras: Carrera[]
}
