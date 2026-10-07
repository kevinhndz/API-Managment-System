import { useEffect, useState } from 'react'
import { asignaturasApi, aulasApi, carrerasApi, docentesApi, estudiantesApi, matriculasApi, periodosApi, seccionesApi } from '../services/api'

export type CatalogOption = { label: string; value: string }

type AcademicLabels = {
  carreras: Record<number, string>
  estudiantes: Record<number, string>
  asignaturas: Record<number, string>
  docentes: Record<number, string>
  aulas: Record<number, string>
  periodos: Record<number, string>
  secciones: Record<number, string>
  matriculas: Record<number, string>
  carreraOptions: CatalogOption[]
  estudianteOptions: CatalogOption[]
  asignaturaOptions: CatalogOption[]
  docenteOptions: CatalogOption[]
  aulaOptions: CatalogOption[]
  periodoOptions: CatalogOption[]
  seccionOptions: CatalogOption[]
  matriculaOptions: CatalogOption[]
}

const emptyLabels: AcademicLabels = {
  carreras: {}, estudiantes: {}, asignaturas: {}, docentes: {}, aulas: {}, periodos: {}, secciones: {}, matriculas: {},
  carreraOptions: [], estudianteOptions: [], asignaturaOptions: [], docenteOptions: [], aulaOptions: [], periodoOptions: [], seccionOptions: [], matriculaOptions: [],
}

let labelsPromise: Promise<AcademicLabels> | null = null

async function cargarTodo<T>(list: (params: { pagina_actual: number; limite: number }) => Promise<{ data: T[]; total_paginas: number }>) {
  const first = await list({ pagina_actual: 1, limite: 100 })
  const rest = await Promise.all(Array.from({ length: Math.max(0, first.total_paginas - 1) }, (_, index) => list({ pagina_actual: index + 2, limite: 100 })))
  return [...first.data, ...rest.flatMap((page) => page.data)]
}

function crearOpciones<T extends { id: number }>(items: T[], label: (item: T) => string): CatalogOption[] {
  return items.map((item) => ({ label: label(item), value: String(item.id) }))
}

function crearCatalogo(): Promise<AcademicLabels> {
  return Promise.all([cargarTodo(carrerasApi.list), cargarTodo(estudiantesApi.list), cargarTodo(asignaturasApi.list), cargarTodo(docentesApi.list), cargarTodo(aulasApi.list), cargarTodo(periodosApi.list), cargarTodo(seccionesApi.list), cargarTodo(matriculasApi.list)]).then(([carreras, estudiantes, asignaturas, docentes, aulas, periodos, secciones, matriculas]) => {
    const carrerasLabels = Object.fromEntries(carreras.map((item) => [item.id, item.nombre]))
    const estudiantesLabels = Object.fromEntries(estudiantes.map((item) => [item.id, item.nombre]))
    const asignaturasLabels = Object.fromEntries(asignaturas.map((item) => [item.id, `${item.codigo} · ${item.nombre}`]))
    const docentesLabels = Object.fromEntries(docentes.map((item) => [item.id, `${item.nombres} ${item.apellidos}`]))
    const aulasLabels = Object.fromEntries(aulas.map((item) => [item.id, item.codigo]))
    const periodosLabels = Object.fromEntries(periodos.map((item) => [item.id, `${item.anio} · período ${item.numero}`]))
    const seccionesLabels = Object.fromEntries(secciones.map((item) => [item.id, `${item.codigo} · ${asignaturasLabels[item.asignatura_id] ?? 'Asignatura'}`]))
    const matriculasLabels = Object.fromEntries(matriculas.map((item) => [item.id, `${item.id} · ${estudiantesLabels[item.estudiante_id] ?? 'Estudiante'}`]))

    return {
      carreras: carrerasLabels, estudiantes: estudiantesLabels, asignaturas: asignaturasLabels, docentes: docentesLabels, aulas: aulasLabels, periodos: periodosLabels, secciones: seccionesLabels, matriculas: matriculasLabels,
      carreraOptions: crearOpciones(carreras, (item) => `${item.codigo} · ${item.nombre}`), estudianteOptions: crearOpciones(estudiantes, (item) => `${item.cuenta} · ${item.nombre}`), asignaturaOptions: crearOpciones(asignaturas, (item) => `${item.codigo} · ${item.nombre}`), docenteOptions: crearOpciones(docentes, (item) => `${item.numero_empleado} · ${item.nombres} ${item.apellidos}`), aulaOptions: crearOpciones(aulas, (item) => item.codigo), periodoOptions: crearOpciones(periodos, (item) => `${item.anio} · período ${item.numero}`), seccionOptions: crearOpciones(secciones, (item) => `${item.codigo} · ${asignaturasLabels[item.asignatura_id] ?? 'Asignatura'}`), matriculaOptions: crearOpciones(matriculas, (item) => `${item.id} · ${estudiantesLabels[item.estudiante_id] ?? 'Estudiante'}`),
    }
  })
}

export function useAcademicLabels() {
  const [labels, setLabels] = useState<AcademicLabels>(emptyLabels)
  useEffect(() => {
    let active = true
    labelsPromise ??= crearCatalogo()
    void labelsPromise.then((nextLabels) => { if (active) setLabels(nextLabels) }).catch(() => undefined)
    return () => { active = false }
  }, [])
  return labels
}
