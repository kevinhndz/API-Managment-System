import { useQuery } from '@tanstack/react-query'

import { dashboardQueryKey } from '../lib/queryClient'
import { dashboardApi } from '../services/api'
import type { DashboardResumen } from '../types/api'

const emptySummary: DashboardResumen = {
  anio: new Date().getFullYear(),
  periodo: null,
  estudiantes: { total: 0, activos: 0 },
  docentes: { activos: 0 },
  carreras: { activas: 0 },
  aulas: { total: 0, activas: 0, capacidad_total: 0 },
  aulas_mayor_capacidad: [],
  edificios: [],
  secciones: { total: 0, abiertas: 0, cerradas: 0, canceladas: 0, otros_estados: 0 },
  matriculas: {
    activas: 0,
    tendencia: Array.from({ length: 12 }, (_, index) => ({ mes: index + 1, activas: 0, canceladas: 0, finalizadas: 0 })),
  },
  calificaciones: { cantidad: 0, promedio: null },
  cupos_ocupados: 0,
  capacidad_secciones_abiertas: 0,
  asignaturas_total: 0,
  periodos_total: 0,
}

export function useDashboardData() {
  const query = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: dashboardApi.resumen,
  })

  return {
    data: query.data ?? emptySummary,
    loading: query.isPending,
    refreshing: query.isFetching,
    error: query.error instanceof Error ? query.error.message : '',
    refresh: query.refetch,
  }
}
