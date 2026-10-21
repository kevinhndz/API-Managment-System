import type { ReportFilters, ReportModule } from '../services/api'

export interface VistaPreviaReporte {
  modulo: ReportModule
  total_registros: number
  columnas: Array<{ titulo: string; campo: string }>
  registros: Array<Record<string, string | number | boolean | null>>
}

export interface SolicitudVistaPrevia {
  id: number
  modulo: ReportModule
  filtros: ReportFilters
  institucion: string
}

export type ResultadoVistaPrevia =
  | { id: number; estado: 'completada'; datos: VistaPreviaReporte }
  | { id: number; estado: 'error'; mensaje: string; codigo: number }
