import { useState } from 'react'
import { FileDown } from 'lucide-react'

import { useAcademicLabels } from '../hooks/useAcademicLabels'
import { descargarReporte, type ReportFilters, type ReportFormat, type ReportModule } from '../services/api'

const modulos: Array<{ value: ReportModule; label: string }> = [
  { value: 'matriculas', label: 'Matrículas' },
  { value: 'secciones', label: 'Secciones' },
  { value: 'estudiantes', label: 'Estudiantes' },
  { value: 'docentes', label: 'Docentes' },
  { value: 'calificaciones', label: 'Calificaciones' },
]

const estados: Record<ReportModule, Array<{ value: string; label: string }>> = {
  matriculas: [{ value: 'ACTIVA', label: 'Activas' }, { value: 'CANCELADA', label: 'Canceladas' }, { value: 'APROBADA', label: 'Aprobadas' }, { value: 'REPROBADA', label: 'Reprobadas' }],
  secciones: [{ value: 'ABIERTA', label: 'Abiertas' }, { value: 'CERRADA', label: 'Cerradas' }, { value: 'CANCELADA', label: 'Canceladas' }],
  estudiantes: [{ value: 'ACTIVO', label: 'Activos' }, { value: 'INACTIVO', label: 'Inactivos' }],
  docentes: [{ value: 'ACTIVO', label: 'Activos' }, { value: 'INACTIVO', label: 'Inactivos' }],
  calificaciones: [],
}

const fieldClass = 'focus-ring mt-2 h-11 w-full rounded-xl border bg-[#faf7f0] px-3 text-sm dark:bg-stone-950'

export function ReportesPage() {
  const labels = useAcademicLabels()
  const [modulo, setModulo] = useState<ReportModule>('matriculas')
  const [filtros, setFiltros] = useState<ReportFilters>({})
  const [descargando, setDescargando] = useState<ReportFormat | null>(null)
  const [error, setError] = useState('')

  const cambiarFiltro = (key: keyof ReportFilters, value: string) => {
    setFiltros((current) => ({ ...current, [key]: value === '' ? undefined : ['periodo_id', 'estudiante_id', 'carrera_id'].includes(key) ? Number(value) : value }))
  }

  const descargar = async (formato: ReportFormat) => {
    setError('')
    setDescargando(formato)
    try {
      await descargarReporte(modulo, formato, filtros)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo descargar el reporte.')
    } finally {
      setDescargando(null)
    }
  }

  return <div className="space-y-5">
    <header>
      <p className="text-sm font-semibold text-sage-600 dark:text-sage-400">Administración</p>
      <h2 className="mt-1 text-2xl font-semibold text-navy-950 dark:text-white">Reportes académicos</h2>
      <p className="mt-2 text-sm text-slate-500">Selecciona los datos y aplica filtros antes de descargar.</p>
    </header>

    <section className="rounded-2xl border bg-[#fffdf8] p-6 shadow-panel dark:bg-stone-900">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium">Módulo
          <select className={fieldClass} value={modulo} onChange={(event) => { setModulo(event.target.value as ReportModule); setFiltros({}); setError('') }}>
            {modulos.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        {estados[modulo].length > 0 && <label className="text-sm font-medium">Estado
          <select className={fieldClass} value={filtros.estado ?? ''} onChange={(event) => cambiarFiltro('estado', event.target.value)}>
            <option value="">Todos los estados</option>
            {estados[modulo].map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>}

        {modulo !== 'docentes' && <label className="text-sm font-medium">Carrera
          <select className={fieldClass} value={filtros.carrera_id ?? ''} onChange={(event) => cambiarFiltro('carrera_id', event.target.value)}>
            <option value="">Todas las carreras</option>
            {labels.carreraOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>}

        {['matriculas', 'secciones', 'calificaciones'].includes(modulo) && <label className="text-sm font-medium">Período
          <select className={fieldClass} value={filtros.periodo_id ?? ''} onChange={(event) => cambiarFiltro('periodo_id', event.target.value)}>
            <option value="">Todos los períodos</option>
            {labels.periodoOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>}

        {modulo === 'matriculas' && <label className="text-sm font-medium">Estudiante
          <select className={fieldClass} value={filtros.estudiante_id ?? ''} onChange={(event) => cambiarFiltro('estudiante_id', event.target.value)}>
            <option value="">Todos los estudiantes</option>
            {labels.estudianteOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>}

        {modulo === 'matriculas' && <>
          <label className="text-sm font-medium">Desde<input className={fieldClass} type="date" value={filtros.desde ?? ''} onChange={(event) => cambiarFiltro('desde', event.target.value)} /></label>
          <label className="text-sm font-medium">Hasta<input className={fieldClass} type="date" value={filtros.hasta ?? ''} min={filtros.desde} onChange={(event) => cambiarFiltro('hasta', event.target.value)} /></label>
        </>}
      </div>

      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-7 flex flex-wrap gap-3 border-t pt-5">
        {(['xlsx', 'pdf'] as const).map((formato) => <button key={formato} type="button" onClick={() => void descargar(formato)} disabled={descargando !== null} className="focus-ring inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50 dark:bg-sage-500">
          <FileDown className="h-4 w-4" />{descargando === formato ? 'Generando…' : `Descargar ${formato === 'xlsx' ? 'Excel' : 'PDF'}`}
        </button>)}
      </div>
    </section>
  </div>
}
