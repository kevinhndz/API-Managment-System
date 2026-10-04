import { useEffect, useState } from 'react'
import { asignaturasApi, aulasApi, docentesApi, estudiantesApi, matriculasApi, periodosApi, seccionesApi } from '../services/api'

export function useAcademicLabels() {
  const [labels, setLabels] = useState({ estudiantes: {} as Record<number, string>, asignaturas: {} as Record<number, string>, docentes: {} as Record<number, string>, aulas: {} as Record<number, string>, periodos: {} as Record<number, string>, secciones: {} as Record<number, string>, matriculas: {} as Record<number, string> })
  useEffect(() => {
    let active = true
    const all = async <T,>(list: (params: { pagina_actual: number; limite: number }) => Promise<{ data: T[]; total_paginas: number }>) => { const first = await list({ pagina_actual: 1, limite: 100 }); const rest = await Promise.all(Array.from({ length: Math.max(0, first.total_paginas - 1) }, (_, index) => list({ pagina_actual: index + 2, limite: 100 }))); return { data: [ ...first.data, ...rest.flatMap((page) => page.data) ] } }
    void Promise.all([all(estudiantesApi.list), all(asignaturasApi.list), all(docentesApi.list), all(aulasApi.list), all(periodosApi.list), all(seccionesApi.list), all(matriculasApi.list)]).then(([estudiantes, asignaturas, docentes, aulas, periodos, secciones, matriculas]) => {
      if (!active) return
      setLabels({ estudiantes: Object.fromEntries(estudiantes.data.map((item) => [item.id, item.nombre])), asignaturas: Object.fromEntries(asignaturas.data.map((item) => [item.id, `${item.codigo} · ${item.nombre}`])), docentes: Object.fromEntries(docentes.data.map((item) => [item.id, `${item.nombres} ${item.apellidos}`])), aulas: Object.fromEntries(aulas.data.map((item) => [item.id, item.codigo])), periodos: Object.fromEntries(periodos.data.map((item) => [item.id, `${item.anio} · periodo ${item.numero}`])), secciones: Object.fromEntries(secciones.data.map((item) => [item.id, item.codigo])), matriculas: Object.fromEntries(matriculas.data.map((item) => [item.id, `${item.id} · ${estudiantes.data.find((student) => student.id === item.estudiante_id)?.nombre ?? 'Estudiante' }`])) })
    }).catch(() => undefined)
    return () => { active = false }
  }, [])
  return labels
}
