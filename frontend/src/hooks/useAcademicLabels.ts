import { useEffect, useState } from 'react'
import { asignaturasApi, aulasApi, docentesApi, estudiantesApi, matriculasApi, periodosApi, seccionesApi } from '../services/api'

export function useAcademicLabels() {
  const [labels, setLabels] = useState({ estudiantes: {} as Record<number, string>, asignaturas: {} as Record<number, string>, docentes: {} as Record<number, string>, aulas: {} as Record<number, string>, periodos: {} as Record<number, string>, secciones: {} as Record<number, string>, matriculas: {} as Record<number, string> })
  useEffect(() => {
    let active = true
    void Promise.all([estudiantesApi.list({ limite: 100 }), asignaturasApi.list({ limite: 100 }), docentesApi.list({ limite: 100 }), aulasApi.list({ limite: 100 }), periodosApi.list({ limite: 100 }), seccionesApi.list({ limite: 100 }), matriculasApi.list({ limite: 100 })]).then(([estudiantes, asignaturas, docentes, aulas, periodos, secciones, matriculas]) => {
      if (!active) return
      setLabels({ estudiantes: Object.fromEntries(estudiantes.data.map((item) => [item.id, item.nombre])), asignaturas: Object.fromEntries(asignaturas.data.map((item) => [item.id, `${item.codigo} · ${item.nombre}`])), docentes: Object.fromEntries(docentes.data.map((item) => [item.id, `${item.nombres} ${item.apellidos}`])), aulas: Object.fromEntries(aulas.data.map((item) => [item.id, item.codigo])), periodos: Object.fromEntries(periodos.data.map((item) => [item.id, `${item.anio} · periodo ${item.numero}`])), secciones: Object.fromEntries(secciones.data.map((item) => [item.id, item.codigo])), matriculas: Object.fromEntries(matriculas.data.map((item) => [item.id, `${item.id} · ${estudiantes.data.find((student) => student.id === item.estudiante_id)?.nombre ?? 'Estudiante' }`])) })
    }).catch(() => undefined)
    return () => { active = false }
  }, [])
  return labels
}
