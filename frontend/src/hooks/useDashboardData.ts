import { useCallback, useEffect, useState } from 'react'

import { asignaturasApi, aulasApi, calificacionesApi, carrerasApi, docentesApi, estudiantesApi, matriculasApi, periodosApi, seccionesApi } from '../services/api'
import type { DashboardData, PaginatedResponse, PaginationParams } from '../types/api'

const emptyData: DashboardData = { aulas: [], docentes: [], carreras: [], estudiantes: [], asignaturas: [], periodos: [], secciones: [], matriculas: [], calificaciones: [] }

type ListarPagina<T> = (params?: PaginationParams) => Promise<PaginatedResponse<T>>

async function listarTodosLosRegistros<T>(listar: ListarPagina<T>) {
  const primeraPagina = await listar({ pagina_actual: 1, limite: 100 })
  const registros = [...primeraPagina.data]

  for (let pagina = 2; pagina <= primeraPagina.total_paginas; pagina += 1) {
    const respuesta = await listar({ pagina_actual: pagina, limite: 100 })
    registros.push(...respuesta.data)
  }

  return registros
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const [aulas, docentes, carreras, estudiantes, asignaturas, periodos, secciones, matriculas, calificaciones] = await Promise.allSettled([
      listarTodosLosRegistros(aulasApi.list),
      listarTodosLosRegistros(docentesApi.list),
      listarTodosLosRegistros(carrerasApi.list),
      listarTodosLosRegistros(estudiantesApi.list),
      listarTodosLosRegistros(asignaturasApi.list),
      listarTodosLosRegistros(periodosApi.list),
      listarTodosLosRegistros(seccionesApi.list),
      listarTodosLosRegistros(matriculasApi.list),
      listarTodosLosRegistros(calificacionesApi.list),
    ])

    setData({
      aulas: aulas.status === 'fulfilled' ? aulas.value : [],
      docentes: docentes.status === 'fulfilled' ? docentes.value : [],
      carreras: carreras.status === 'fulfilled' ? carreras.value : [],
      estudiantes: estudiantes.status === 'fulfilled' ? estudiantes.value : [],
      asignaturas: asignaturas.status === 'fulfilled' ? asignaturas.value : [],
      periodos: periodos.status === 'fulfilled' ? periodos.value : [],
      secciones: secciones.status === 'fulfilled' ? secciones.value : [],
      matriculas: matriculas.status === 'fulfilled' ? matriculas.value : [],
      calificaciones: calificaciones.status === 'fulfilled' ? calificaciones.value : [],
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
