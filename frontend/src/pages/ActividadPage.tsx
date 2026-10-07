import { useEffect, useState } from 'react'
import { History } from 'lucide-react'

import { listarActividad, type AuditEvent } from '../services/api'

const fieldClass = 'focus-ring h-10 rounded-xl border bg-[#faf7f0] px-3 text-sm dark:bg-stone-950'

export function ActividadPage() {
  const [eventos, setEventos] = useState<AuditEvent[]>([])
  const [modulo, setModulo] = useState('')
  const [accion, setAccion] = useState('')
  const [usuario, setUsuario] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setCargando(true)
    setError('')

    void listarActividad({ modulo, accion, usuario, desde, hasta }).then((data) => {
      if (active) setEventos(data)
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar la actividad.')
    }).finally(() => {
      if (active) setCargando(false)
    })

    return () => { active = false }
  }, [modulo, accion, usuario, desde, hasta])

  return <div className="space-y-5">
    <header>
      <p className="text-sm font-semibold text-sage-600 dark:text-sage-400">Administración</p>
      <h2 className="mt-1 text-2xl font-semibold text-navy-950 dark:text-white">Actividad reciente</h2>
      <p className="mt-2 text-sm text-slate-500">Consulta quién modificó los registros y qué reportes descargó.</p>
    </header>

    <section className="rounded-2xl border bg-[#fffdf8] shadow-panel dark:bg-stone-900">
      <div className="flex flex-wrap gap-3 border-b p-4">
        <select aria-label="Filtrar por módulo" className={fieldClass} value={modulo} onChange={(event) => setModulo(event.target.value)}>
          <option value="">Todos los módulos</option>
          {['aulas', 'docentes', 'carreras', 'estudiantes', 'asignaturas', 'periodos', 'secciones', 'matriculas', 'calificaciones'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Filtrar por acción" className={fieldClass} value={accion} onChange={(event) => setAccion(event.target.value)}>
          <option value="">Todas las acciones</option>
          {['CREAR', 'EDITAR', 'ELIMINAR', 'EXPORTAR'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input aria-label="Buscar usuario" className={fieldClass} placeholder="Buscar usuario" value={usuario} onChange={(event) => setUsuario(event.target.value)} />
        <input aria-label="Desde" className={fieldClass} type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
        <input aria-label="Hasta" className={fieldClass} type="date" min={desde} value={hasta} onChange={(event) => setHasta(event.target.value)} />
      </div>

      {error && <p role="alert" className="p-5 text-sm text-red-700">{error}</p>}
      {cargando ? <p className="p-8 text-sm text-slate-500">Cargando actividad…</p> : eventos.length === 0 ? <p className="p-8 text-sm text-slate-500">No hay actividad para estos filtros.</p> : <ol className="divide-y dark:divide-stone-800">
        {eventos.map((evento) => <li key={evento.id} className="flex gap-4 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f4e7e8] text-[#5b0309] dark:bg-stone-800 dark:text-rose-200"><History className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy-950 dark:text-white">{evento.usuario} · {evento.accion.toLocaleLowerCase('es')} · {evento.modulo}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{evento.descripcion}{evento.registro_id ? ` (#${evento.registro_id})` : ''}</p>
          </div>
          <time className="text-xs text-slate-500" dateTime={evento.fecha}>{new Date(evento.fecha).toLocaleString('es-HN')}</time>
        </li>)}
      </ol>}
    </section>
  </div>
}
