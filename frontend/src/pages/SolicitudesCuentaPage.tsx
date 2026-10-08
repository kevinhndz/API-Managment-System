import { Check, RefreshCw, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { docentesApi, listarSolicitudesCuenta, revisarSolicitudCuenta, type SolicitudCuenta } from '../services/api'
import type { Docente } from '../types/api'

export function SolicitudesCuentaPage() {
  const { user } = useAuth()
  const [solicitudes, setSolicitudes] = useState<SolicitudCuenta[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [roles, setRoles] = useState<Record<number, 'Docente' | 'Administrador'>>({})
  const [docentesSeleccionados, setDocentesSeleccionados] = useState<Record<number, number>>({})
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [ocupada, setOcupada] = useState<number | null>(null)
  const administrador = ['admin', 'administrador'].includes(user?.role.toLocaleLowerCase('es') ?? '')

  const cargar = useCallback(async () => {
    setError('')
    try {
      const [cuentas, personal] = await Promise.all([
        listarSolicitudesCuenta(),
        docentesApi.list({ pagina_actual: 1, limite: 100 }),
      ])
      setSolicitudes(cuentas)
      setDocentes(personal.data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  async function revisar(solicitud: SolicitudCuenta, decision: 'aprobar' | 'rechazar') {
    setOcupada(solicitud.id)
    setError('')
    try {
      const rol = roles[solicitud.id] ?? 'Docente'
      await revisarSolicitudCuenta(
        solicitud.id,
        decision,
        rol,
        rol === 'Docente' ? docentesSeleccionados[solicitud.id] : undefined,
      )
      await cargar()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo revisar la solicitud.')
    } finally {
      setOcupada(null)
    }
  }

  if (!administrador) return <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">Esta seccion esta disponible solo para administradores.</section>

  return <section className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a716f]">Administracion de cuentas</p><h2 className="mt-2 text-3xl font-semibold text-[#261b1a] dark:text-white">Solicitudes de acceso</h2><p className="mt-2 text-sm text-slate-600 dark:text-stone-300">Elige el rol institucional al aprobar. La persona solicitante no puede asignarselo.</p></div>
      <button type="button" onClick={() => { setCargando(true); void cargar() }} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-[#faf4f1] dark:bg-[#302624] dark:hover:bg-stone-800"><RefreshCw className="h-4 w-4" /> Actualizar</button>
    </div>
    {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200" role="alert">{error}</p>}
    {cargando ? <div className="mt-7 h-40 animate-pulse rounded-3xl bg-white/70 dark:bg-stone-900" aria-label="Cargando solicitudes" /> : solicitudes.length === 0 ? <div className="mt-7 rounded-3xl border border-dashed p-10 text-center text-sm text-slate-500">No hay solicitudes por revisar.</div> : <div className="mt-7 grid gap-4">{solicitudes.map((solicitud) => <article key={solicitud.id} className="rounded-3xl border border-[#ead7d7] bg-white/85 p-5 shadow-sm dark:border-stone-700 dark:bg-[#302624] sm:flex sm:items-center sm:justify-between sm:gap-5">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{solicitud.nombre_completo}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${solicitud.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100' : solicitud.estado === 'APROBADA' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100' : 'bg-slate-100 text-slate-700 dark:bg-stone-800 dark:text-stone-300'}`}>{solicitud.estado}</span></div><p className="mt-1 truncate text-sm text-slate-600 dark:text-stone-300">{solicitud.correo} · Usuario: {solicitud.usuario}</p><p className="mt-1 text-xs text-slate-500">Enviada: {new Date(solicitud.created_at).toLocaleString('es')}</p></div>
      {solicitud.estado === 'PENDIENTE' && <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0">
        <select aria-label={`Rol para ${solicitud.nombre_completo}`} className="h-10 rounded-xl border bg-white px-3 text-sm dark:bg-[#211a19]" value={roles[solicitud.id] ?? 'Docente'} onChange={(event) => setRoles((current) => ({ ...current, [solicitud.id]: event.target.value as 'Docente' | 'Administrador' }))}><option value="Docente">Docente</option><option value="Administrador">Administrador</option></select>
        {(roles[solicitud.id] ?? 'Docente') === 'Docente' && <div className="grid gap-1"><select aria-label={`Registro docente para ${solicitud.nombre_completo}`} className="h-10 max-w-56 rounded-xl border bg-white px-3 text-sm dark:bg-[#211a19]" value={docentesSeleccionados[solicitud.id] ?? ''} onChange={(event) => setDocentesSeleccionados((current) => ({ ...current, [solicitud.id]: Number(event.target.value) }))} required><option value="">Vincular docente existente...</option>{docentes.filter((docente) => docente.estado).map((docente) => <option key={docente.id} value={docente.id}>{docente.numero_empleado} · {docente.nombres} {docente.apellidos}</option>)}</select><span className="max-w-56 text-[11px] text-slate-500">Para nuevo ingreso, registra primero su ficha en Docentes.</span></div>}
        <button type="button" disabled={ocupada === solicitud.id || ((roles[solicitud.id] ?? 'Docente') === 'Docente' && !docentesSeleccionados[solicitud.id])} onClick={() => void revisar(solicitud, 'aprobar')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"><Check className="h-4 w-4" /> Aprobar</button>
        <button type="button" disabled={ocupada === solicitud.id} onClick={() => void revisar(solicitud, 'rechazar')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-800 hover:bg-red-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/30 disabled:opacity-50"><X className="h-4 w-4" /> Rechazar</button>
      </div>}
    </article>)}</div>}
  </section>
}
