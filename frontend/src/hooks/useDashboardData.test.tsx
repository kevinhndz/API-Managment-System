import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useDashboardData } from './useDashboardData'
import { dashboardApi } from '../services/api'
import { queryClient } from '../lib/queryClient'
import type { DashboardResumen } from '../types/api'

const resumen: DashboardResumen = {
  anio: 2026,
  periodo: { anio: 2026, numero: 1 },
  estudiantes: { total: 10, activos: 8 },
  docentes: { activos: 2 },
  carreras: { activas: 1 },
  aulas: { total: 1, activas: 1, capacidad_total: 30 },
  aulas_mayor_capacidad: [{ codigo: 'A-01', capacidad: 30 }],
  edificios: [{ nombre: 'Edificio Norte', aulas_activas: 1, aulas_totales: 1, ocupacion: 50, capacidad: 20 }],
  secciones: { total: 1, abiertas: 1, cerradas: 0, canceladas: 0, otros_estados: 0 },
  matriculas: {
    activas: 1,
    tendencia: Array.from({ length: 12 }, (_, index) => ({ mes: index + 1, activas: 0, canceladas: 0, finalizadas: 0 })),
  },
  calificaciones: { cantidad: 1, promedio: 85 },
  cupos_ocupados: 1,
  capacidad_secciones_abiertas: 20,
  asignaturas_total: 1,
  periodos_total: 1,
}

describe('useDashboardData', () => {
  afterEach(() => {
    queryClient.clear()
    vi.restoreAllMocks()
  })

  it('reutiliza el resumen en memoria al volver a montar el dashboard', async () => {
    const cargarResumen = vi.spyOn(dashboardApi, 'resumen').mockResolvedValue(resumen)
    const clienteDePrueba = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={clienteDePrueba}>{children}</QueryClientProvider>
    )

    const primeraVisita = renderHook(() => useDashboardData(), { wrapper })
    await waitFor(() => expect(primeraVisita.result.current.loading).toBe(false))
    primeraVisita.unmount()

    const segundaVisita = renderHook(() => useDashboardData(), { wrapper })

    expect(segundaVisita.result.current.data.estudiantes.activos).toBe(8)
    expect(cargarResumen).toHaveBeenCalledTimes(1)
    clienteDePrueba.clear()
  })
})
