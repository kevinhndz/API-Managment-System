import { ArrowLeft, Download, History, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CircularCarousel, type CarouselItem } from '../components/dashboard/CircularCarousel'
import { ExpandableSearchBar } from '../components/ui/ExpandableSearchBar'
import { listarActividad, type AuditEvent } from '../services/api'
import { academicModuleCards as activityModules } from '../data/academicModuleCards'

const actionIcons = {
  CREAR: Plus,
  EDITAR: Pencil,
  ELIMINAR: Trash2,
  EXPORTAR: Download,
}

const fieldClass = 'focus-ring h-10 rounded-xl border bg-[#faf7f0] px-3 text-sm dark:border-[#39334b] dark:bg-[#191625]'

function nombreModulo(modulo: string) {
  return activityModules.find((item) => item.value === modulo)?.title ?? modulo
}

function fechaLegible(value: string) {
  return new Intl.DateTimeFormat('es-HN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function mostrarDato(valor: unknown) {
  if (valor === null || valor === undefined) return '—'
  if (typeof valor === 'boolean') return valor ? 'Si' : 'No'
  return String(valor)
}

export function ActividadPage() {
  const [eventos, setEventos] = useState<AuditEvent[]>([])
  const [modulo, setModulo] = useState('')
  const [accion, setAccion] = useState('')
  const [usuario, setUsuario] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const moduloActivo = activityModules.find((item) => item.value === modulo)

  useEffect(() => {
    let active = true
    setError('')

    if (!modulo) {
      setEventos([])
      setCargando(false)
      return () => { active = false }
    }

    setCargando(true)

    void listarActividad({ modulo, accion, usuario, desde, hasta }).then((data) => {
      if (active) setEventos(data)
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar la actividad.')
    }).finally(() => {
      if (active) setCargando(false)
    })

    return () => { active = false }
  }, [modulo, accion, usuario, desde, hasta])

  function seleccionarModulo(item: CarouselItem) {
    setModulo(item.value ?? '')
  }

  function mostrarTodosLosModulos() {
    setModulo('')
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-sage-600 dark:text-sage-400">
          <History aria-hidden="true" className="h-4 w-4" /> Registro del campus
        </div>
        <h2 className="text-2xl font-semibold text-navy-950 dark:text-white">Actividad reciente</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Consulta quién modificó los registros y qué reportes descargó. Elige un módulo para revisar sus movimientos.</p>
      </header>

      {!moduloActivo ? (
        <section className="overflow-hidden rounded-2xl border bg-[#fffdf8] shadow-panel dark:border-[#39334b] dark:bg-[#242033]" aria-labelledby="activity-module-heading">
          <div className="border-b px-5 py-4 dark:border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Explorar por módulo</p>
            <h3 id="activity-module-heading" className="mt-1 text-sm font-bold text-navy-950 dark:text-white">¿Qué parte del campus quieres revisar?</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pasa el cursor o selecciona una tarjeta para abrir su actividad.</p>
          </div>
          <div className="px-2 pb-4 pt-1 sm:px-5">
            <CircularCarousel items={activityModules} onSelect={seleccionarModulo} onHover={seleccionarModulo} />
          </div>
        </section>
      ) : (
        <section key={moduloActivo.value} className="activity-detail" aria-label={`Actividad del módulo ${moduloActivo.title}`}>
          <div className="activity-detail__module">
            <img src={moduloActivo.src} alt={moduloActivo.alt} />
            <div className="activity-detail__shade" aria-hidden="true" />
            <div className="activity-detail__module-copy">
              <span>Módulo seleccionado</span>
              <h3>{moduloActivo.title}</h3>
              <p>Movimientos recientes del campus</p>
            </div>
          </div>

          <div className="activity-detail__content overflow-hidden rounded-2xl border bg-[#fffdf8] shadow-panel dark:border-[#39334b] dark:bg-[#242033]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 dark:border-white/10 sm:px-5">
              <div>
                <button className="mb-3 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:text-violet-200 dark:hover:bg-white/5" type="button" onClick={mostrarTodosLosModulos}>
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Elegir otro módulo
                </button>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Registro de cambios</p>
                <h3 id="activity-results-heading" className="mt-1 text-base font-bold text-navy-950 dark:text-white">Actividad de {moduloActivo.title}</h3>
              </div>
              <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-800 dark:bg-violet-400/10 dark:text-violet-200" aria-live="polite">
                {cargando ? 'Actualizando…' : `${eventos.length} ${eventos.length === 1 ? 'registro' : 'registros'}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b p-4 dark:border-white/10">
              <label className="sr-only" htmlFor="activity-action-filter">Filtrar por acción</label>
              <select id="activity-action-filter" className={fieldClass} value={accion} onChange={(event) => setAccion(event.target.value)}>
                <option value="">Todas las acciones</option>
                <option value="CREAR">Crear</option>
                <option value="EDITAR">Editar</option>
                <option value="ELIMINAR">Eliminar</option>
                <option value="EXPORTAR">Exportar reporte</option>
              </select>
              <ExpandableSearchBar ariaLabel="Buscar usuario" placeholder="Buscar usuario" value={usuario} onChange={setUsuario} width={220} />
              <label className="sr-only" htmlFor="activity-date-from">Desde</label>
              <input id="activity-date-from" aria-label="Desde" className={fieldClass} type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
              <label className="sr-only" htmlFor="activity-date-to">Hasta</label>
              <input id="activity-date-to" aria-label="Hasta" className={fieldClass} type="date" min={desde} value={hasta} onChange={(event) => setHasta(event.target.value)} />
            </div>

            {error ? (
              <p role="alert" className="p-5 text-sm text-red-700 dark:text-red-300">{error}</p>
            ) : cargando ? (
              <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400" role="status">Cargando actividad…</p>
            ) : eventos.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"><History aria-hidden="true" className="h-5 w-5" /></span>
                <p className="mt-3 text-sm font-semibold text-navy-950 dark:text-white">No encontramos movimientos en {moduloActivo.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Prueba con otro módulo o ajusta los filtros.</p>
              </div>
            ) : (
              <ol className="divide-y dark:divide-white/10" aria-label={`Eventos recientes de ${moduloActivo.title}`}>
                {eventos.map((evento) => {
                  const ActionIcon = actionIcons[evento.accion as keyof typeof actionIcons] ?? History
                  return (
                    <li key={evento.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[.025] sm:flex-row sm:items-start sm:px-5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-400/10 dark:text-violet-200"><ActionIcon aria-hidden="true" className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-navy-950 dark:text-white">{evento.usuario}<span className="font-normal text-slate-500 dark:text-slate-400"> · {evento.accion.toLocaleLowerCase('es')} en </span>{nombreModulo(evento.modulo)}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{evento.descripcion}{evento.registro_id ? ` (#${evento.registro_id})` : ''}</p>
                        {Object.keys({ ...evento.datos_anteriores, ...evento.datos_nuevos }).length > 0 && (
                          <dl className="mt-2 grid gap-1 text-xs text-slate-600 dark:text-slate-300">
                            {Object.keys({ ...evento.datos_anteriores, ...evento.datos_nuevos }).map((campo) => (
                              <div key={campo} className="flex flex-wrap gap-1">
                                <dt className="font-semibold">{campo.replaceAll('_', ' ')}:</dt>
                                <dd>{mostrarDato(evento.datos_anteriores?.[campo])} → {mostrarDato(evento.datos_nuevos?.[campo])}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        {evento.ip_origen && <p className="mt-1 text-xs text-slate-500">IP: {evento.ip_origen}</p>}
                      </div>
                      <time className="shrink-0 text-xs text-slate-500 dark:text-slate-400 sm:pt-1" dateTime={evento.fecha}>{fechaLegible(evento.fecha)}</time>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
