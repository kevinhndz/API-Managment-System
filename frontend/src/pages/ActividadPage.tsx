import { Download, History, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listarActividad, type AuditEvent } from '../services/api'
import { academicModuleCards as activityModules } from '../data/academicModuleCards'
import './ActividadPage.css'

const actionIcons = { CREAR: Plus, EDITAR: Pencil, ELIMINAR: Trash2, EXPORTAR: Download }
const actionLabels: Record<string, string> = { CREAR: 'creó', EDITAR: 'editó', ELIMINAR: 'eliminó', EXPORTAR: 'exportó' }
const timezone = 'America/Tegucigalpa'
const dateKey = (date: string) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(date))
const dateLabel = (date: string) => new Intl.DateTimeFormat('es-HN', { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
function mostrarDato(value: unknown) { return value === null || value === undefined ? '—' : typeof value === 'boolean' ? value ? 'Sí' : 'No' : String(value) }

export function ActividadPage() {
  const [eventos, setEventos] = useState<AuditEvent[]>([])
  const [modulo, setModulo] = useState('')
  const [accion, setAccion] = useState('')
  const [usuario, setUsuario] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  useEffect(() => { const timer = window.setTimeout(() => setUsuario(busqueda), 250); return () => window.clearTimeout(timer) }, [busqueda])
  const fechasInvalidas = Boolean(desde && hasta && desde > hasta)

  useEffect(() => {
    let active = true
    setError('')
    if (fechasInvalidas) { setCargando(false); return }
    setCargando(true)
    void listarActividad({ modulo, accion, usuario, desde, hasta }).then((data) => {
      if (active) setEventos(data)
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar la actividad.')
    }).finally(() => { if (active) setCargando(false) })
    return () => { active = false }
  }, [modulo, accion, usuario, desde, hasta, fechasInvalidas])

  const grupos = useMemo(() => {
    const fechas = new Map<string, AuditEvent[]>()
    for (const evento of eventos) { const key = dateKey(evento.fecha); fechas.set(key, [...(fechas.get(key) ?? []), evento]) }
    return [...fechas.entries()]
  }, [eventos])

  function limpiar() { setModulo(''); setAccion(''); setBusqueda(''); setUsuario(''); setDesde(''); setHasta('') }

  return <div className="academic-activity">
    <header className="academic-page-header"><h1>Actividad reciente</h1></header>
    <section aria-label="Filtros de actividad" className="academic-activity-filters">
      <label>Módulo<select aria-label="Filtrar por módulo" value={modulo} onChange={(event) => setModulo(event.target.value)}><option value="">Todos los módulos</option>{activityModules.map((item) => <option key={item.value} value={item.value}>{item.title}</option>)}</select></label>
      <label>Acción<select aria-label="Filtrar por acción" value={accion} onChange={(event) => setAccion(event.target.value)}><option value="">Todas las acciones</option><option value="CREAR">Crear</option><option value="EDITAR">Editar</option><option value="ELIMINAR">Eliminar</option><option value="EXPORTAR">Exportar reporte</option></select></label>
      <label>Buscar<span className="academic-activity-search"><input type="search" aria-label="Buscar usuario" placeholder="Buscar usuario" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /><Search size={16} aria-hidden="true" /></span></label>
      <label>Desde<input aria-label="Desde" type="date" value={desde} max={hasta || undefined} onChange={(event) => setDesde(event.target.value)} /></label>
      <label>Hasta<input aria-label="Hasta" type="date" min={desde} value={hasta} onChange={(event) => setHasta(event.target.value)} /></label>
      <button type="button" className="focus-ring academic-clear-filters" onClick={limpiar}>Limpiar filtros</button>
    </section>
    {fechasInvalidas ? <p role="alert" className="academic-error">La fecha inicial debe ser anterior a la fecha final.</p> : error ? <p role="alert" className="academic-error">{error}</p> : cargando ? <p role="status" className="academic-empty">Cargando actividad…</p> : !eventos.length ? <section className="academic-activity-empty"><History size={28} aria-hidden="true" /><h2>No se encontraron movimientos</h2><p>Prueba con otro módulo o ajusta los filtros.</p></section> : <section aria-label="Movimientos registrados" aria-live="polite">
      <p className="academic-activity-count">{eventos.length} {eventos.length === 1 ? 'movimiento registrado' : 'movimientos registrados'}</p>
      {grupos.map(([fecha, registros]) => <section className="academic-activity-day" key={fecha}><h2>{dateLabel(registros[0].fecha)}</h2><ol>{registros.map((evento) => {
        const Icon = actionIcons[evento.accion as keyof typeof actionIcons] ?? History
        const nombre = activityModules.find((item) => item.value === evento.modulo)?.title ?? evento.modulo
        const campos = Object.keys({ ...evento.datos_anteriores, ...evento.datos_nuevos })
        return <li key={evento.id}>
          <Icon size={18} aria-hidden="true" /><div><p><strong>{evento.usuario}</strong> {actionLabels[evento.accion] ?? evento.accion.toLocaleLowerCase('es')} un registro de {nombre}{evento.registro_id ? <>: <strong>Registro #{evento.registro_id}</strong></> : ''}</p>
            {(campos.length > 0 || evento.descripcion || evento.ip_origen) && <details><summary>Ver detalle</summary><p>{evento.descripcion}</p>{campos.length > 0 && <dl>{campos.map((campo) => <div key={campo}><dt>{campo.replaceAll('_', ' ')}:</dt><dd>{mostrarDato(evento.datos_anteriores?.[campo])} → {mostrarDato(evento.datos_nuevos?.[campo])}</dd></div>)}</dl>}{evento.ip_origen && <p>IP: {evento.ip_origen}</p>}</details>}
          </div><time dateTime={evento.fecha}>{new Intl.DateTimeFormat('es-HN', { timeZone: timezone, hour: 'numeric', minute: '2-digit' }).format(new Date(evento.fecha))}</time>
        </li>
      })}</ol></section>)}
      <p className="academic-activity-count">Mostrando {eventos.length} de {eventos.length} {eventos.length === 1 ? 'movimiento' : 'movimientos'}</p>
    </section>}
  </div>
}
