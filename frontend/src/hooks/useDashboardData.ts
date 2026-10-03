import { useCallback, useEffect, useState } from 'react'

import { aulasApi, carrerasApi, docentesApi } from '../services/api'
import type { DashboardData } from '../types/api'

const emptyData: DashboardData = { aulas: [], docentes: [], carreras: [] }

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const [aulas, docentes, carreras] = await Promise.allSettled([
      aulasApi.list({ limite: 100 }),
      docentesApi.list({ limite: 100 }),
      carrerasApi.list({ limite: 100 }),
    ])

    setData({
      aulas: aulas.status === 'fulfilled' ? aulas.value.data : [],
      docentes: docentes.status === 'fulfilled' ? docentes.value.data : [],
      carreras: carreras.status === 'fulfilled' ? carreras.value.data : [],
    })

    if ([aulas, docentes, carreras].some((result) => result.status === 'rejected')) {
      setError('Algunos indicadores no pudieron sincronizarse con la API.')
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refresh: load }
}
