import { ArrowLeft, ArrowRight, ChevronDown, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AnimatedDownloadButton } from '../components/ui/AnimatedDownloadButton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { AcademicStatusBadge } from '../components/ui/AcademicStatusBadge'
import { useAcademicLabels } from '../hooks/useAcademicLabels'
import type { CatalogOption } from '../hooks/useAcademicLabels'
import { academicModuleCards } from '../data/academicModuleCards'
import { descargarReporte, INSTITUTION_SLUG, type ReportFilters, type ReportFormat, type ReportModule } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import type { ResultadoVistaPrevia, VistaPreviaReporte } from '../workers/reportePreview.types'

const modulos: Array<{ value: ReportModule; label: string }> = [
  { value: 'matriculas', label: 'Matrículas' },
  { value: 'secciones', label: 'Secciones' },
  { value: 'estudiantes', label: 'Estudiantes' },
  { value: 'docentes', label: 'Docentes' },
  { value: 'calificaciones', label: 'Calificaciones' },
  { value: 'matricula_carrera', label: 'Matricula por carrera' },
  { value: 'ocupacion_secciones', label: 'Ocupacion y cupos' },
  { value: 'rendimiento_asignaturas', label: 'Rendimiento por asignatura' },
  { value: 'carga_docente', label: 'Carga docente' },
  { value: 'actividad_usuario', label: 'Actividad por usuario' },
  { value: 'cambios_sensibles', label: 'Cambios sensibles' },
]

const estados: Record<ReportModule, Array<{ value: string; label: string }>> = {
  matriculas: [{ value: 'ACTIVA', label: 'Activas' }, { value: 'CANCELADA', label: 'Canceladas' }, { value: 'APROBADA', label: 'Aprobadas' }, { value: 'REPROBADA', label: 'Reprobadas' }],
  secciones: [{ value: 'ABIERTA', label: 'Abiertas' }, { value: 'CERRADA', label: 'Cerradas' }, { value: 'CANCELADA', label: 'Canceladas' }],
  estudiantes: [{ value: 'ACTIVO', label: 'Activos' }, { value: 'INACTIVO', label: 'Inactivos' }],
  docentes: [{ value: 'ACTIVO', label: 'Activos' }, { value: 'INACTIVO', label: 'Inactivos' }],
  calificaciones: [],
  matricula_carrera: [],
  ocupacion_secciones: [],
  rendimiento_asignaturas: [],
  carga_docente: [],
  actividad_usuario: [],
  cambios_sensibles: [],
}

const formatos: Array<{ value: ReportFormat; label: string }> = [
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
]

const fieldClass = 'focus-ring mt-2 h-11 w-full rounded-xl border bg-[#faf7f0] px-3 text-sm dark:border-[#39334b] dark:bg-[#191625]'

function normalizarBusqueda(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
}

function SelectorBuscable({
  label,
  options,
  value,
  placeholder,
  onChange,
}: {
  label: string
  options: CatalogOption[]
  value?: number
  placeholder: string
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === String(value ?? ''))
  const filteredOptions = useMemo(() => {
    const queryNormalizada = normalizarBusqueda(query.trim())
    if (!queryNormalizada) return options
    return options.filter((option) => normalizarBusqueda(option.label).includes(queryNormalizada))
  }, [options, query])

  useEffect(() => setQuery(selected?.label ?? ''), [selected?.label])

  function elegir(option?: CatalogOption) {
    setQuery(option?.label ?? '')
    setOpen(false)
    onChange(option?.value ?? '')
  }

  return <label className="relative block text-sm font-medium">
    {label}
    <span className="relative mt-2 block">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className={`${fieldClass} mt-0 pl-9 pr-9`}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${label.toLocaleLowerCase('es').replaceAll(' ', '-')}-options`}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onFocus={(event) => {
          setOpen(true)
          event.currentTarget.select()
        }}
        onBlur={() => window.setTimeout(() => {
          setOpen(false)
          setQuery(selected?.label ?? '')
        }, 120)}
        onChange={(event) => {
          const nextQuery = event.target.value
          setQuery(nextQuery)
          setOpen(true)
          if (!nextQuery) onChange('')
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
          if (event.key === 'Enter' && filteredOptions.length === 1) {
            event.preventDefault()
            elegir(filteredOptions[0])
          }
        }}
      />
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </span>
    {open && <div id={`${label.toLocaleLowerCase('es').replaceAll(' ', '-')}-options`} role="listbox" aria-label={`Opciones de ${label}`} className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-[#39334b] dark:bg-[#242033]">
      <button type="button" role="option" aria-selected={!value} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-white/5" onMouseDown={(event) => event.preventDefault()} onClick={() => elegir()}>
        {label === 'Estudiante' ? 'Todos los estudiantes' : 'Todas las carreras'}
      </button>
      {filteredOptions.map((option) => <button key={option.value} type="button" role="option" aria-selected={String(value ?? '') === option.value} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-violet-50 dark:hover:bg-white/5" onMouseDown={(event) => event.preventDefault()} onClick={() => elegir(option)}>
        {option.label}
      </button>)}
      {filteredOptions.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">No hay coincidencias.</p>}
    </div>}
  </label>
}

function mostrarValor(valor: string | number | boolean | null) {
  if (valor === null) return '—'
  if (typeof valor === 'boolean') return <StatusBadge active={valor} />
  if (typeof valor === 'string' && /^(ACTIVA|CANCELADA|APROBADA|REPROBADA|ABIERTA|CERRADA|PENDIENTE|RECHAZADA|INACTIVA|INACTIVO)$/i.test(valor.trim())) return <AcademicStatusBadge status={valor} />
  return String(valor)
}

export function ReportesPage() {
  const labels = useAcademicLabels()
  const { user } = useAuth()
  const esDocente = user?.role.toLocaleLowerCase('es') === 'docente'
  const [moduloActivo, setModuloActivo] = useState<ReportModule | null>(null)
  const [filtros, setFiltros] = useState<ReportFilters>({})
  const [descargando, setDescargando] = useState<ReportFormat | null>(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<VistaPreviaReporte | null>(null)
  const [consultando, setConsultando] = useState(false)
  const [errorVista, setErrorVista] = useState('')
  const trabajador = useRef<Worker | null>(null)
  const solicitudActual = useRef(0)

  useEffect(() => () => trabajador.current?.terminate(), [])

  const invalidarVista = () => {
    solicitudActual.current += 1
    trabajador.current?.terminate()
    trabajador.current = null
    setVista(null)
    setConsultando(false)
    setErrorVista('')
  }

  const cambiarFiltro = (key: keyof ReportFilters, value: string) => {
    invalidarVista()
    setFiltros((current) => ({ ...current, [key]: value === '' ? undefined : ['periodo_id', 'estudiante_id', 'carrera_id'].includes(key) ? Number(value) : value }))
  }

  const consultarVista = () => {
    if (!moduloActivo) return
    const id = ++solicitudActual.current
    setVista(null)
    setErrorVista('')
    setConsultando(true)

    try {
      if (!trabajador.current) {
        const nuevoTrabajador = new Worker(new URL('../workers/reportePreview.worker.ts', import.meta.url), { type: 'module' })
        nuevoTrabajador.onmessage = (event: MessageEvent<ResultadoVistaPrevia>) => {
          if (event.data.id !== solicitudActual.current) return
          setConsultando(false)
          if (event.data.estado === 'completada') {
            setVista(event.data.datos)
          } else if (event.data.codigo === 401) {
            window.location.assign('/login')
          } else {
            setErrorVista(event.data.mensaje)
          }
        }
        nuevoTrabajador.onerror = () => {
          setConsultando(false)
          setErrorVista('No se pudo iniciar la consulta en segundo plano.')
          nuevoTrabajador.terminate()
          trabajador.current = null
        }
        trabajador.current = nuevoTrabajador
      }

      trabajador.current.postMessage({ id, modulo: moduloActivo, filtros, institucion: INSTITUTION_SLUG })
    } catch {
      setConsultando(false)
      setErrorVista('Este navegador no pudo iniciar la consulta en segundo plano.')
    }
  }

  const seleccionarModulo = (modulo: ReportModule) => {
    invalidarVista()
    setModuloActivo(modulo)
    setFiltros({})
    setError('')
  }

  const volverAModulos = () => {
    invalidarVista()
    setModuloActivo(null)
    setFiltros({})
    setError('')
  }

  const descargar = async (formato: ReportFormat) => {
    if (!moduloActivo) return
    setError('')
    setDescargando(formato)
    try {
      await descargarReporte(moduloActivo, formato, filtros)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo descargar el reporte.')
    } finally {
      setDescargando(null)
    }
  }

  const modulosDisponibles = esDocente ? modulos.filter((item) => item.value === 'calificaciones') : modulos
  const tarjetaActiva = moduloActivo ? academicModuleCards.find((item) => item.value === moduloActivo) : undefined

  return <div className="space-y-5">
    <header>
      <p className="text-sm font-semibold text-sage-600 dark:text-sage-400">{esDocente ? 'Operación académica' : 'Administración'}</p>
      <h2 className="mt-1 text-2xl font-semibold text-navy-950 dark:text-white">Reportes académicos</h2>
      <p className="mt-2 text-sm text-slate-500">{esDocente ? 'Descarga las calificaciones de tus secciones asignadas.' : 'Selecciona los datos y aplica filtros antes de descargar.'}</p>
    </header>

    {!moduloActivo ? (
      <section aria-label="Elegir tipo de reporte" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {modulosDisponibles.map((item) => {
          const card = academicModuleCards.find((moduleCard) => moduleCard.value === item.value)
          if (!card) return null
          return <button key={item.value} type="button" aria-label={`${item.label}: abrir reporte académico`} onClick={() => seleccionarModulo(item.value)} className="group relative min-h-64 overflow-hidden rounded-2xl border border-white/50 text-left shadow-panel transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-violet-400 dark:border-white/10">
            <img src={card.src} alt={card.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/5" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
              <span><span className="block text-xs font-semibold uppercase tracking-[.14em] text-white/75">Reporte académico</span><strong className="mt-1 block text-xl">{item.label}</strong><span className="mt-1 block text-sm text-white/80">Filtrar y consultar datos</span></span>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/40 bg-white/10 transition group-hover:bg-violet-500"><ArrowRight aria-hidden="true" className="h-5 w-5" /></span>
            </span>
          </button>
        })}
      </section>
    ) : <section key={moduloActivo} className="grid gap-5 xl:grid-cols-[minmax(220px,0.75fr)_minmax(0,2fr)]">
      <div className="relative min-h-56 overflow-hidden rounded-2xl shadow-panel xl:sticky xl:top-5 xl:h-[calc(100vh-8rem)] xl:max-h-[620px]">
        {tarjetaActiva && <><img src={tarjetaActiva.src} alt={tarjetaActiva.alt} className="absolute inset-0 h-full w-full object-cover" /><span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/5" /><div className="absolute inset-x-0 bottom-0 p-5 text-white"><button type="button" onClick={volverAModulos} className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/40 bg-black/20 px-3 py-2 text-sm font-semibold hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Elegir otro reporte</button><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/75">Reporte académico</p><h3 className="mt-1 text-2xl font-bold">{tarjetaActiva.title}</h3></div></>}
      </div>

      <div className="space-y-5">
      <section aria-label={`Filtros de ${modulos.find((item) => item.value === moduloActivo)?.label}`} className="rounded-2xl border bg-[#fffdf8] p-6 shadow-panel dark:border-[#39334b] dark:bg-[#242033]">
      <h3 className="text-lg font-semibold text-navy-950 dark:text-white">Filtros del reporte</h3>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {estados[moduloActivo].length > 0 && <label className="text-sm font-medium">Estado
          <select className={fieldClass} value={filtros.estado ?? ''} onChange={(event) => cambiarFiltro('estado', event.target.value)}>
            <option value="">Todos los estados</option>
            {estados[moduloActivo].map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>}

        {!['docentes', 'carga_docente', 'actividad_usuario', 'cambios_sensibles'].includes(moduloActivo) && <SelectorBuscable label="Carrera" options={labels.carreraOptions} value={filtros.carrera_id} placeholder="Buscar carrera por nombre o código" onChange={(value) => cambiarFiltro('carrera_id', value)} />}

        {['matriculas', 'secciones', 'calificaciones', 'matricula_carrera', 'ocupacion_secciones', 'rendimiento_asignaturas', 'carga_docente'].includes(moduloActivo) && <label className="text-sm font-medium">Período
          <select className={fieldClass} value={filtros.periodo_id ?? ''} onChange={(event) => cambiarFiltro('periodo_id', event.target.value)}>
            <option value="">Todos los períodos</option>
            {labels.periodoOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>}

        {moduloActivo === 'matriculas' && <SelectorBuscable label="Estudiante" options={labels.estudianteOptions} value={filtros.estudiante_id} placeholder="Buscar por nombre o número de cuenta" onChange={(value) => cambiarFiltro('estudiante_id', value)} />}

        {['matriculas', 'actividad_usuario', 'cambios_sensibles'].includes(moduloActivo) && <>
          <label className="text-sm font-medium">Desde<input className={fieldClass} type="date" value={filtros.desde ?? ''} onChange={(event) => cambiarFiltro('desde', event.target.value)} /></label>
          <label className="text-sm font-medium">Hasta<input className={fieldClass} type="date" value={filtros.hasta ?? ''} min={filtros.desde} onChange={(event) => cambiarFiltro('hasta', event.target.value)} /></label>
        </>}
      </div>

      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      </section>

      <section aria-label="Vista previa y descarga" className="rounded-2xl border bg-[#fffdf8] p-6 shadow-panel dark:border-[#39334b] dark:bg-[#242033]">
      <div className="flex flex-wrap gap-3">
        {formatos.map(({ value: formato, label }) => (
          <AnimatedDownloadButton
            key={formato}
            label={label}
            loading={descargando === formato}
            disabled={descargando !== null}
            onClick={() => void descargar(formato)}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500" role="note">
        Los archivos se descargan en la ubicación configurada en tu navegador. CSV puede abrirse en una hoja de cálculo; JSON conserva los datos estructurados.
      </p>

      <div className="mt-7 border-t pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={consultarVista} className="focus-ring rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-[#39334b] dark:hover:bg-[#302a42]">
            {consultando ? 'Actualizar consulta' : 'Consultar vista previa'}
          </button>
          {consultando && <span role="status" className="text-sm text-slate-500">Consultando en segundo plano. Puedes seguir usando los filtros.</span>}
        </div>
        {errorVista && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errorVista}</p>}
        {vista && <div className="mt-5">
          <p className="text-sm font-medium">{vista.total_registros} registros encontrados. Se muestran los primeros {vista.registros.length}.</p>
          <div className="mt-3 overflow-x-auto rounded-xl border dark:border-[#39334b]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-[#302a42]"><tr>{vista.columnas.map((columna) => <th key={columna.campo} scope="col" className="whitespace-nowrap px-3 py-2">{columna.titulo}</th>)}</tr></thead>
              <tbody>{vista.registros.map((registro, index) => <tr key={index} className="border-t dark:border-[#39334b]">{vista.columnas.map((columna) => <td key={columna.campo} className="whitespace-nowrap px-3 py-2">{mostrarValor(registro[columna.campo] ?? null)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>}
      </div>

      {esDocente && <p className="mt-5 rounded-xl border border-sage-200 bg-sage-50 p-3 text-sm text-sage-900 dark:border-sage-800 dark:bg-sage-950/30 dark:text-sage-200">
        El reporte incluye solo tus secciones asignadas. Si no aparecen datos, pide al administrador que te asigne secciones y verifica que tengan calificaciones registradas.
      </p>}
      </section>
      </div>
    </section>}
  </div>
}
