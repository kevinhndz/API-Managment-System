import { useCallback, useEffect, useState } from 'react'

import { asignaturasApi, aulasApi, calificacionesApi, carrerasApi, docentesApi, estudiantesApi, matriculasApi, periodosApi, seccionesApi } from '../services/api'
import type { DashboardData } from '../types/api'

const emptyData: DashboardData = { aulas: [], docentes: [], carreras: [], estudiantes: [], asignaturas: [], periodos: [], secciones: [], matriculas: [], calificaciones: [] }

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const [aulas, docentes, carreras, estudiantes, asignaturas, periodos, secciones, matriculas, calificaciones] = await Promise.allSettled([
      aulasApi.list({ limite: 100 }),
      docentesApi.list({ limite: 100 }),
      carrerasApi.list({ limite: 100 }),
      estudiantesApi.list({ limite: 100 }),
      asignaturasApi.list({ limite: 100 }),
      periodosApi.list({ limite: 100 }),
      seccionesApi.list({ limite: 100 }),
      matriculasApi.list({ limite: 100 }),
      calificacionesApi.list({ limite: 100 }),
    ])

    setData({
      aulas: aulas.status === 'fulfilled' ? aulas.value.data : [],
      docentes: docentes.status === 'fulfilled' ? docentes.value.data : [],
      carreras: carreras.status === 'fulfilled' ? carreras.value.data : [],
      estudiantes: estudiantes.status === 'fulfilled' ? estudiantes.value.data : [],
      asignaturas: asignaturas.status === 'fulfilled' ? asignaturas.value.data : [],
      periodos: periodos.status === 'fulfilled' ? periodos.value.data : [],
      secciones: secciones.status === 'fulfilled' ? secciones.value.data : [],
      matriculas: matriculas.status === 'fulfilled' ? matriculas.value.data : [],
      calificaciones: calificaciones.status === 'fulfilled' ? calificaciones.value.data : [],
    })

    if ([aulas, docentes, carreras, estudiantes, asignaturas, periodos, secciones, matriculas, calificaciones].some((result) => result.status === 'rejected')) {
      setError('Algunos indicadores no pudieron sincronizarse con la API.')
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refresh: load }
}
