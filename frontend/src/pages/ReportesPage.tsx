import { ChevronDown, Download, FileSearch, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Modal } from '../components/ui/Modal'
import './ReportesPage.css'
import { VistaArchivoDialog, type ArchivoEnVista } from '../components/reportes/VistaArchivoDialog'
import { StatusBadge } from '../components/ui/StatusBadge'
import { AcademicStatusBadge } from '../components/ui/AcademicStatusBadge'
import { useAcademicLabels } from '../hooks/useAcademicLabels'
import type { CatalogOption } from '../hooks/useAcademicLabels'
import { descargarDocumento, descargarReporte, INSTITUTION_SLUG, obtenerSlugInstitucion, obtenerCargaDocente, previsualizarDocumento, previsualizarHistorial, previsualizarReporte, subirLogoInstitucional, urlLogoInstitucional, type CargaDocente, type ReportFilters, type ReportFormat, type ReportModule } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import type { ResultadoVistaPrevia, VistaPreviaReporte } from '../workers/reportePreview.types'

type ModuloDocumento = 'historial_academico' | 'constancia_estudiantil' | 'constancia_laboral'
type ModuloPagina = ReportModule | ModuloDocumento
const esDocumento = (modulo: ModuloPagina): modulo is ModuloDocumento => ['historial_academico', 'constancia_estudiantil', 'constancia_laboral'].includes(modulo)

const modulos: Array<{ value: ModuloPagina; label: string }> = [
  { value: 'matriculas', label: 'Matrículas' },
  { value: 'secciones', label: 'Secciones' },
  { value: 'estudiantes', label: 'Estudiantes' },
  { value: 'docentes', label: 'Docentes' },
  { value: 'calificaciones', label: 'Calificaciones' },
  { value: 'matricula_carrera', label: 'Matricula por carrera' },
  { value: 'ocupacion_secciones', label: 'Ocupacion y cupos' },
  { value: 'rendimiento_asignaturas', label: 'Rendimiento por asignatura' },
  { value: 'carga_docente', label: 'Carga docente' },
  { value: 'detalle_carga_docente', label: 'Materias y secciones por docente' },
  { value: 'estudiantes_asignatura', label: 'Estudiantes por asignatura' },
  { value: 'cobros_estudiantiles', label: 'Cobros estudiantiles' },
  { value: 'nomina_docente', label: 'Nomina docente' },
  { value: 'asignaturas_sin_oferta', label: 'Asignaturas sin oferta' },
  { value: 'poblacion_carrera', label: 'Poblacion por carrera' },
  { value: 'matricula_estado', label: 'Matricula por estado' },
  { value: 'historial_academico', label: 'Historial academico' },
  { value: 'constancia_estudiantil', label: 'Constancia estudiantil' },
  { value: 'constancia_laboral', label: 'Constancia laboral' },
]

const estados: Record<ModuloPagina, Array<{ value: string; label: string }>> = {
  matriculas: [{ value: 'ACTIVA', label: 'Activas' }, { value: 'CANCELADA', label: 'Canceladas' }, { value: 'APROBADA', label: 'Aprobadas' }, { value: 'REPROBADA', label: 'Reprobadas' }],
  secciones: [{ value: 'ABIERTA', label: 'Abiertas' }, { value: 'CERRADA', label: 'Cerradas' }, { value: 'CANCELADA', label: 'Canceladas' }],
  estudiantes: [{ value: 'ACTIVO', label: 'Activos' }, { value: 'INACTIVO', label: 'Inactivos' }],
  docentes: [{ value: 'ACTIVO', label: 'Activos' }, { value: 'INACTIVO', label: 'Inactivos' }],
  calificaciones: [],
  matricula_carrera: [],
  ocupacion_secciones: [],
  rendimiento_asignaturas: [],
  carga_docente: [],
  detalle_carga_docente: [],
  estudiantes_asignatura: [],
  cobros_estudiantiles: [{ value: 'PAGADO', label: 'Pagados' }, { value: 'PARCIAL', label: 'Parciales' }, { value: 'VENCIDO', label: 'Vencidos' }, { value: 'PENDIENTE', label: 'Pendientes' }],
  nomina_docente: [{ value: 'PAGADO', label: 'Pagados' }, { value: 'PARCIAL', label: 'Parciales' }, { value: 'VENCIDO', label: 'Vencidos' }, { value: 'PENDIENTE', label: 'Pendientes' }],
  asignaturas_sin_oferta: [],
  poblacion_carrera: [],
  matricula_estado: [],
  historial_academico: [],
  constancia_estudiantil: [],
  constancia_laboral: [],
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
        {({ Estudiante: 'Todos los estudiantes', Docente: 'Todos los docentes', Asignatura: 'Todas las asignaturas', Carrera: 'Todas las carreras' } as Record<string, string>)[label] ?? 'Todos'}
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

function leerTexto(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result ?? ''))
    lector.onerror = () => reject(new Error('No se pudo leer la vista previa.'))
    lector.readAsText(blob)
  })
}

export function ReportesPage() {
  const labels = useAcademicLabels()
  const { user } = useAuth()
  const esDocente = user?.role.toLocaleLowerCase('es') === 'docente'
  const [moduloActivo, setModuloActivo] = useState<ModuloPagina>(esDocente ? 'calificaciones' : 'estudiantes')
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ReportFormat>('xlsx')
  const [resultsPage, setResultsPage] = useState(1)
  const [filtrosConsultados, setFiltrosConsultados] = useState<ReportFilters>({})
  const [filtros, setFiltros] = useState<ReportFilters>({})
  const [descargando, setDescargando] = useState<ReportFormat | null>(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<VistaPreviaReporte | null>(null)
  const [consultando, setConsultando] = useState(false)
  const [errorVista, setErrorVista] = useState('')
  const [archivo, setArchivo] = useState<ArchivoEnVista | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState('')
  const [logoRevision, setLogoRevision] = useState(0)
  const [logoDisponible, setLogoDisponible] = useState(true)
  const [guardandoLogo, setGuardandoLogo] = useState(false)
  const [cargaDocente, setCargaDocente] = useState<CargaDocente[]>([])
  const [cargandoCarga, setCargandoCarga] = useState(false)
  const [errorCarga, setErrorCarga] = useState('')
  const trabajador = useRef<Worker | null>(null)
  const solicitudActual = useRef(0)
  const solicitudArchivo = useRef(0)
  const urlArchivo = useRef<string | null>(null)
  const seleccionArchivo = useRef<{ modulo: ModuloPagina; filtros: ReportFilters; formato: ReportFormat } | null>(null)

  useEffect(() => () => {
    trabajador.current?.terminate()
    if (urlArchivo.current) URL.revokeObjectURL(urlArchivo.current)
  }, [])

  const cerrarArchivo = () => {
    solicitudArchivo.current += 1
    if (urlArchivo.current) URL.revokeObjectURL(urlArchivo.current)
    urlArchivo.current = null
    seleccionArchivo.current = null
    setArchivo(null)
    setErrorArchivo('')
  }

  const invalidarVista = () => {
    cerrarArchivo()
    setExportOpen(false)
    setResultsPage(1)
    solicitudActual.current += 1
    trabajador.current?.terminate()
    trabajador.current = null
    setVista(null)
    setConsultando(false)
    setErrorVista('')
  }

  const cambiarFiltro = (key: keyof ReportFilters, value: string) => {
    invalidarVista()
    setFiltros((current) => ({ ...current, [key]: value === '' ? undefined : ['periodo_id', 'estudiante_id', 'docente_id', 'asignatura_id', 'carrera_id'].includes(key) ? Number(value) : value }))
  }

  useEffect(() => {
    if (moduloActivo !== 'detalle_carga_docente' || !filtros.docente_id) {
      setCargaDocente([])
      setErrorCarga('')
      return
    }
    let activo = true
    setCargandoCarga(true)
    setErrorCarga('')
    void obtenerCargaDocente(filtros.docente_id, filtros.periodo_id).then((datos) => {
      if (activo) setCargaDocente(datos)
    }).catch((motivo: unknown) => {
      if (activo) setErrorCarga(motivo instanceof Error ? motivo.message : 'No se pudo consultar la carga docente.')
    }).finally(() => { if (activo) setCargandoCarga(false) })
    return () => { activo = false }
  }, [moduloActivo, filtros.docente_id, filtros.periodo_id])

  const consultarVista = () => {
    if (!moduloActivo || esDocumento(moduloActivo)) return
    if (moduloActivo === 'detalle_carga_docente' && !filtros.docente_id) { setErrorVista('Selecciona un docente para consultar sus materias y secciones.'); return }
    if (moduloActivo === 'estudiantes_asignatura' && !filtros.asignatura_id) { setErrorVista('Selecciona una asignatura para consultar sus estudiantes.'); return }
    const id = ++solicitudActual.current
    setVista(null)
    setErrorVista('')
    setConsultando(true)
    setFiltrosConsultados({ ...filtros })
    setResultsPage(1)

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

      trabajador.current.postMessage({ id, modulo: moduloActivo, filtros, institucion: obtenerSlugInstitucion() })
    } catch {
      setConsultando(false)
      setErrorVista('Este navegador no pudo iniciar la consulta en segundo plano.')
    }
  }

  const seleccionarModulo = (modulo: ModuloPagina) => {
    invalidarVista()
    setModuloActivo(modulo)
    setFiltros({})
    setError('')
  }

  const abrirVistaArchivo = async (formato: ReportFormat) => {
    if (!moduloActivo) return
    if (esDocumento(moduloActivo) && !(moduloActivo === 'constancia_laboral' ? filtros.docente_id : filtros.estudiante_id)) {
      setError('Selecciona una persona antes de preparar el documento.')
      return
    }
    if (moduloActivo === 'detalle_carga_docente' && !filtros.docente_id) { setError('Selecciona un docente antes de preparar el reporte.'); return }
    if (moduloActivo === 'estudiantes_asignatura' && !filtros.asignatura_id) { setError('Selecciona una asignatura antes de preparar el reporte.'); return }
    cerrarArchivo()
    const id = solicitudArchivo.current
    const modulo = moduloActivo
    const filtrosAplicados = { ...filtros }
    setError('')
    setDescargando(formato)
    try {
      const blob = modulo === 'historial_academico' ? await previsualizarHistorial(filtrosAplicados.estudiante_id!)
        : esDocumento(modulo)
        ? await previsualizarDocumento(modulo.replaceAll('_', '-') as 'constancia-estudiantil' | 'constancia-laboral', (modulo === 'constancia_laboral' ? filtrosAplicados.docente_id : filtrosAplicados.estudiante_id)!)
        : await previsualizarReporte(modulo, formato, filtrosAplicados)
      if (id !== solicitudArchivo.current) return
      seleccionArchivo.current = { modulo, filtros: filtrosAplicados, formato }
      const titulo = modulos.find((item) => item.value === modulo)?.label ?? modulo
      if (formato === 'csv' || formato === 'json') {
        const texto = await leerTexto(blob)
        if (id !== solicitudArchivo.current) return
        setArchivo({ titulo, formato, texto })
      } else {
        const url = URL.createObjectURL(blob)
        urlArchivo.current = url
        setArchivo({ titulo, formato, url })
      }
    } catch (reason) {
      if (id === solicitudArchivo.current) setError(reason instanceof Error ? reason.message : 'No se pudo preparar la vista previa.')
    } finally {
      if (id === solicitudArchivo.current) setDescargando(null)
    }
  }

  const confirmarDescarga = async () => {
    const seleccion = seleccionArchivo.current
    if (!seleccion) return
    setConfirmando(true)
    setErrorArchivo('')
    try {
      if (esDocumento(seleccion.modulo)) {
        await descargarDocumento(seleccion.modulo.replaceAll('_', '-') as 'historial-academico' | 'constancia-estudiantil' | 'constancia-laboral', (seleccion.modulo === 'constancia_laboral' ? seleccion.filtros.docente_id : seleccion.filtros.estudiante_id)!)
      } else {
        await descargarReporte(seleccion.modulo, seleccion.formato, seleccion.filtros)
      }
      cerrarArchivo()
      setExportOpen(false)
    } catch (reason) {
      setErrorArchivo(reason instanceof Error ? reason.message : 'No se pudo descargar el archivo.')
    } finally {
      setConfirmando(false)
    }
  }

  const actualizarLogo = async (archivoLogo?: File) => {
    if (!archivoLogo) return
    setError('')
    setGuardandoLogo(true)
    try {
      await subirLogoInstitucional(archivoLogo)
      setLogoDisponible(true)
      setLogoRevision(Date.now())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el logo.')
    } finally {
      setGuardandoLogo(false)
    }
  }

  const opciones = esDocente ? modulos.filter((item) => item.value === 'calificaciones') : modulos
  const titulo = modulos.find((item) => item.value === moduloActivo)?.label ?? moduloActivo
  const esPdf = esDocumento(moduloActivo)
  const registrosVisibles = vista?.registros.slice((resultsPage - 1) * 10, resultsPage * 10) ?? []
  const paginas = Math.max(1, Math.ceil((vista?.registros.length ?? 0) / 10))
  const resumenFiltros = Object.entries(esPdf ? filtros : filtrosConsultados).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => {
    const opciones = key === 'carrera_id' ? labels.carreraOptions : key === 'periodo_id' ? labels.periodoOptions : key === 'docente_id' ? labels.docenteOptions : key === 'estudiante_id' ? labels.estudianteOptions : key === 'asignatura_id' ? labels.asignaturaOptions : []
    return `${key.replaceAll('_id', '').replaceAll('_', ' ')}: ${opciones.find((item) => item.value === String(value))?.label ?? value}`
  }).join(' · ') || 'Todos los registros'

  function prepararExportacion() {
    setErrorArchivo('')
    setExportFormat(esPdf ? 'pdf' : 'xlsx')
    setExportOpen(true)
  }

  return <div className="academic-reports">
    <header className="academic-page-header"><h1>Reportes académicos</h1></header>
    <section aria-label="Configuracion del reporte" className="academic-report-controls">
      <label className="academic-report-type">Tipo de reporte<select aria-label="Tipo de reporte" className={fieldClass} value={moduloActivo} onChange={(event) => seleccionarModulo(event.target.value as ModuloPagina)}>{opciones.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <div className="academic-report-filters">
        {estados[moduloActivo].length > 0 && <label className="text-sm font-medium">Estado
          <select className={fieldClass} value={filtros.estado ?? ''} onChange={(event) => cambiarFiltro('estado', event.target.value)}>
            <option value="">Todos los estados</option>
            {estados[moduloActivo].map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>}

        {!['docentes', 'carga_docente', 'detalle_carga_docente', 'estudiantes_asignatura', 'historial_academico', 'constancia_estudiantil', 'constancia_laboral', 'cobros_estudiantiles', 'nomina_docente'].includes(moduloActivo) && <SelectorBuscable label="Carrera" options={labels.carreraOptions} value={filtros.carrera_id} placeholder="Buscar carrera por nombre o código" onChange={(value) => cambiarFiltro('carrera_id', value)} />}

        {['matriculas', 'secciones', 'calificaciones', 'matricula_carrera', 'ocupacion_secciones', 'rendimiento_asignaturas', 'carga_docente', 'detalle_carga_docente', 'estudiantes_asignatura', 'asignaturas_sin_oferta', 'matricula_estado'].includes(moduloActivo) && <label className="text-sm font-medium">Período
          <select className={fieldClass} value={filtros.periodo_id ?? ''} onChange={(event) => cambiarFiltro('periodo_id', event.target.value)}>
            <option value="">Todos los períodos</option>
            {labels.periodoOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>}

        {['cobros_estudiantiles', 'nomina_docente'].includes(moduloActivo) && <label className="text-sm font-medium">Mes<input className={fieldClass} type="month" value={filtros.mes ?? ''} onChange={(event) => cambiarFiltro('mes', event.target.value)} /></label>}
        {moduloActivo === 'matriculas' && <SelectorBuscable label="Estudiante" options={labels.estudianteOptions} value={filtros.estudiante_id} placeholder="Buscar por nombre o número de cuenta" onChange={(value) => cambiarFiltro('estudiante_id', value)} />}
        {['constancia_laboral', 'carga_docente', 'detalle_carga_docente', 'calificaciones'].includes(moduloActivo) && !esDocente && <SelectorBuscable label="Docente" options={labels.docenteOptions} value={filtros.docente_id} placeholder="Buscar por nombre o numero de empleado" onChange={(value) => cambiarFiltro('docente_id', value)} />}
        {moduloActivo === 'estudiantes_asignatura' && <SelectorBuscable label="Asignatura" options={labels.asignaturaOptions} value={filtros.asignatura_id} placeholder="Buscar por codigo o nombre" onChange={(value) => cambiarFiltro('asignatura_id', value)} />}
        {['historial_academico', 'constancia_estudiantil'].includes(moduloActivo) && <SelectorBuscable label="Estudiante" options={labels.estudianteOptions} value={filtros.estudiante_id} placeholder="Buscar por nombre o numero de cuenta" onChange={(value) => cambiarFiltro('estudiante_id', value)} />}

        {moduloActivo === 'matriculas' && <>
          <label className="text-sm font-medium">Desde<input className={fieldClass} type="date" value={filtros.desde ?? ''} onChange={(event) => cambiarFiltro('desde', event.target.value)} /></label>
          <label className="text-sm font-medium">Hasta<input className={fieldClass} type="date" value={filtros.hasta ?? ''} min={filtros.desde} onChange={(event) => cambiarFiltro('hasta', event.target.value)} /></label>
        </>}
        <div className="academic-report-filter-actions">{!esPdf && <button type="button" className="academic-button academic-button--primary" disabled={consultando} onClick={consultarVista}><Search size={16} />{consultando ? 'Consultando…' : 'Consultar datos'}</button>}
          <button type="button" className="academic-button" onClick={() => { invalidarVista(); setFiltros({}); setError('') }}>Limpiar filtros</button>
        </div>
      </div>
      {error && <p role="alert" className="academic-error">{error}</p>}
      {errorVista && <p role="alert" className="academic-error">{errorVista}</p>}
      {consultando && <p role="status" className="academic-report-note">Consultando en segundo plano. Puedes seguir usando los filtros.</p>}
    </section>
      {moduloActivo === 'detalle_carga_docente' && <section aria-label="Materias y secciones del docente" className="rounded-2xl border bg-[#fffdf8] p-5 shadow-panel dark:border-[#39334b] dark:bg-[#242033]">
        <h3 className="font-semibold">Materias y secciones del docente</h3>
        {!filtros.docente_id ? <p className="mt-2 text-sm text-slate-500">Selecciona un docente para ver todas sus asignaciones.</p> : cargandoCarga ? <p role="status" className="mt-2 text-sm text-slate-500">Consultando asignaciones...</p> : errorCarga ? <p role="alert" className="mt-2 text-sm text-red-700">{errorCarga}</p> : cargaDocente.length === 0 ? <p className="mt-2 text-sm text-slate-500">No hay materias ni secciones para este docente con los filtros elegidos.</p> : <div className="mt-3 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b dark:border-white/10"><th className="px-3 py-2">Periodo</th><th className="px-3 py-2">Asignatura</th><th className="px-3 py-2">Seccion</th><th className="px-3 py-2">Horario</th><th className="px-3 py-2">Estado</th></tr></thead><tbody>{cargaDocente.map((item) => <tr key={`${item.periodo_id}-${item.seccion}`} className="border-b dark:border-white/10"><td className="px-3 py-2">{item.anio}-{item.numero}</td><td className="px-3 py-2">{item.codigo_asignatura} · {item.asignatura}</td><td className="px-3 py-2">{item.seccion}</td><td className="px-3 py-2">{item.dias} {item.hora_inicio}-{item.hora_fin}</td><td className="px-3 py-2">{item.estado_seccion}</td></tr>)}</tbody></table></div>}
      </section>}

    {esPdf ? <section className="academic-document-controls" aria-label="Documentos institucionales">
      {esDocumento(moduloActivo) && <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border bg-[#faf7f0] p-4 dark:border-white/10 dark:bg-[#191625]">
        {logoDisponible ? <img className="h-16 w-20 rounded-lg bg-white object-contain p-1" src={urlLogoInstitucional(logoRevision)} alt="Logo institucional" onError={() => setLogoDisponible(false)} /> : <div className="grid h-16 w-20 place-items-center rounded-lg bg-white text-sm font-bold text-[#5b0309]">{INSTITUTION_SLUG.toUpperCase()}</div>}
        <div className="min-w-48 flex-1"><p className="text-sm font-semibold">Logo del documento institucional</p><p className="text-xs text-slate-500">El PDF usara el logo de esta universidad. Si aun no existe, se mostrara su sigla.</p></div>
        <label className="focus-ring cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold dark:border-white/20">{guardandoLogo ? 'Guardando logo...' : 'Cargar logo PNG o JPG'}<input className="sr-only" type="file" accept="image/png,image/jpeg" disabled={guardandoLogo} onChange={(event) => { void actualizarLogo(event.target.files?.[0]); event.target.value = '' }} /></label>
      </div>}
      <button type="button" className="academic-button academic-button--primary" onClick={prepararExportacion}><Download size={16} />Preparar documento PDF</button>
    </section> : <section className="academic-report-results" aria-label="Resultados del reporte">
      <header><h2>Resultados {vista && <span>{vista.total_registros.toLocaleString('es-HN')} registros</span>}</h2><button type="button" className="academic-button" disabled={!vista || consultando} onClick={prepararExportacion}><Download size={16} />Exportar<ChevronDown size={14} /></button></header>
      {!vista ? <div className="academic-report-empty"><FileSearch size={32} aria-hidden="true" /><h3>Consulta los datos del reporte</h3><p>Selecciona el tipo de reporte y los filtros, luego presiona Consultar datos.</p></div> : vista.total_registros === 0 ? <div className="academic-report-empty"><h3>No se encontraron registros</h3><p>Ajusta los filtros y vuelve a consultar.</p></div> : <>
        <div className="overflow-x-auto"><table><thead><tr>{vista.columnas.map((columna) => <th key={columna.campo} scope="col">{columna.titulo}</th>)}</tr></thead><tbody>{registrosVisibles.map((registro, index) => <tr key={index}>{vista.columnas.map((columna) => <td key={columna.campo}>{mostrarValor(registro[columna.campo] ?? null)}</td>)}</tr>)}</tbody></table></div>
        <footer><p>Mostrando {(resultsPage - 1) * 10 + 1}–{Math.min(resultsPage * 10, vista.registros.length)} de {vista.total_registros.toLocaleString('es-HN')} registros{vista.total_registros > vista.registros.length ? ` · Vista previa limitada a ${vista.registros.length}; la exportación incluye todos` : ''}</p><nav aria-label="Paginación del reporte"><button type="button" className="academic-button" disabled={resultsPage === 1} onClick={() => setResultsPage((value) => value - 1)} aria-label="Página anterior del reporte">‹</button><span>{resultsPage} / {paginas}</span><button type="button" className="academic-button" disabled={resultsPage === paginas} onClick={() => setResultsPage((value) => value + 1)} aria-label="Página siguiente del reporte">›</button></nav></footer>
      </>}
    </section>}
    {esDocente && <p className="academic-report-note">El reporte incluye solo tus secciones asignadas.</p>}
    <Modal open={exportOpen} title="Vista previa de exportación" onClose={() => { if (!confirmando) setExportOpen(false) }}>
      <div className="academic-export-summary"><dl><div><dt>Tipo de reporte:</dt><dd>{titulo}</dd></div><div><dt>Filtros aplicados:</dt><dd>{resumenFiltros}</dd></div><div><dt>Cantidad de registros a exportar:</dt><dd>{esPdf ? 'Documento individual' : `${vista?.total_registros.toLocaleString('es-HN') ?? 0} registros`}<small>Todos los registros coincidentes</small></dd></div><div><dt>Formato seleccionado:</dt><dd><select aria-label="Formato de exportación" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ReportFormat)}>{(esPdf ? formatos.filter((item) => item.value === 'pdf') : formatos).map((item) => <option key={item.value} value={item.value}>{item.label} (.{item.value})</option>)}</select></dd></div></dl>
      <p>La descarga incluirá todos los registros que coinciden con los filtros aplicados.</p>{errorArchivo && <p role="alert" className="academic-error">{errorArchivo}</p>}</div>
      <footer className="academic-export-actions"><button type="button" className="academic-button" disabled={confirmando} onClick={() => setExportOpen(false)}>Cancelar</button><button type="button" className="academic-button" disabled={descargando !== null || confirmando} onClick={() => void abrirVistaArchivo(exportFormat)}>{descargando ? 'Preparando…' : 'Ver contenido'}</button><button type="button" className="academic-button academic-button--primary" disabled={confirmando} onClick={() => { seleccionArchivo.current = { modulo: moduloActivo, filtros: { ...(esPdf ? filtros : filtrosConsultados) }, formato: exportFormat }; void confirmarDescarga() }}><Download size={16} />{confirmando ? 'Descargando…' : `Descargar reporte (.${exportFormat})`}</button></footer>
    </Modal>
    {archivo && <VistaArchivoDialog archivo={archivo} descargando={confirmando} error={errorArchivo} onClose={cerrarArchivo} onDownload={() => void confirmarDescarga()} />}
  </div>
}
