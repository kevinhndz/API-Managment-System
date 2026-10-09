import { ArrowLeft, Check, RefreshCw, UserPlus, UsersRound, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import {
  docentesApi,
  listarSolicitudesCuenta,
  revisarSolicitudCuenta,
  type SolicitudCuenta,
  type NuevoDocenteSolicitud,
} from '../services/api'
import type { Docente } from '../types/api'

type RolCuenta = 'Docente' | 'Administrador'
type ModoDocente = 'existente' | 'nuevo'

const datosDocenteVacios: NuevoDocenteSolicitud = {
  numero_empleado: '',
  nombres: '',
  apellidos: '',
}

export function SolicitudesCuentaPage() {
  const { user } = useAuth()
  const [solicitudes, setSolicitudes] = useState<SolicitudCuenta[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [roles, setRoles] = useState<Record<number, RolCuenta>>({})
  const [modosDocente, setModosDocente] = useState<Record<number, ModoDocente>>({})
  const [docentesSeleccionados, setDocentesSeleccionados] = useState<Record<number, number>>({})
  const [datosNuevos, setDatosNuevos] = useState<Record<number, NuevoDocenteSolicitud>>({})
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
      if (decision === 'rechazar') {
        await revisarSolicitudCuenta(solicitud.id, decision)
      } else {
        const rol = roles[solicitud.id] ?? 'Docente'
        const modo = modosDocente[solicitud.id] ?? 'existente'
        const docenteId = rol === 'Docente' && modo === 'existente'
          ? docentesSeleccionados[solicitud.id]
          : undefined
        const docenteNuevo = rol === 'Docente' && modo === 'nuevo'
          ? datosNuevos[solicitud.id] ?? datosDocenteVacios
          : undefined

        await revisarSolicitudCuenta(solicitud.id, decision, {
          rol,
          docente_id: docenteId,
          docente_nuevo: docenteNuevo,
        })
      }
      await cargar()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo revisar la solicitud.')
    } finally {
      setOcupada(null)
    }
  }

  function actualizarDatoDocente(
    solicitudId: number,
    campo: keyof NuevoDocenteSolicitud,
    valor: string,
  ) {
    setDatosNuevos((actuales) => ({
      ...actuales,
      [solicitudId]: {
        ...(actuales[solicitudId] ?? datosDocenteVacios),
        [campo]: valor,
      },
    }))
  }

  function puedeAprobar(solicitud: SolicitudCuenta) {
    const rol = roles[solicitud.id] ?? 'Docente'
    if (rol === 'Administrador') return true

    const modo = modosDocente[solicitud.id] ?? 'existente'
    if (modo === 'existente') return Boolean(docentesSeleccionados[solicitud.id])

    const docente = datosNuevos[solicitud.id] ?? datosDocenteVacios
    return Boolean(
      docente.numero_empleado.trim()
      && docente.nombres.trim()
      && docente.apellidos.trim(),
    )
  }

  if (!administrador) {
    return <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
      Esta seccion esta disponible solo para administradores.
    </section>
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b1118] hover:underline dark:text-violet-200"><ArrowLeft className="h-4 w-4" /> Volver al dashboard</Link>
        <Link to="/configuracion" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b1118] hover:underline dark:text-violet-200"><ArrowLeft className="h-4 w-4" /> Volver a Settings</Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a716f]">Administracion de cuentas</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#261b1a] dark:text-white">Solicitudes de acceso</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-stone-300">Elige el rol institucional al aprobar. La persona solicitante no puede asignarselo.</p>
        </div>
        <button
          type="button"
          onClick={() => { setCargando(true); void cargar() }}
          className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-[#faf4f1] dark:border-[#39334b] dark:bg-[#242033] dark:hover:bg-[#302a43]"
        >
          <RefreshCw className="h-4 w-4" /> Actualizar
        </button>
      </div>

      {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200" role="alert">{error}</p>}

      {cargando ? (
        <div className="mt-7 h-40 animate-pulse rounded-3xl bg-white/70 dark:bg-[#242033]" aria-label="Cargando solicitudes" />
      ) : solicitudes.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed p-10 text-center text-sm text-slate-500">No hay solicitudes por revisar.</div>
      ) : (
        <div className="mt-7 grid gap-4">
          {solicitudes.map((solicitud) => {
            const rol = roles[solicitud.id] ?? 'Docente'
            const modo = modosDocente[solicitud.id] ?? 'existente'
            const docenteNuevo = datosNuevos[solicitud.id] ?? datosDocenteVacios

            return (
              <article key={solicitud.id} className="rounded-3xl border border-[#ead7d7] bg-white/85 p-5 shadow-sm dark:border-[#39334b] dark:bg-[#242033]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{solicitud.nombre_completo}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${solicitud.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100' : solicitud.estado === 'APROBADA' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100' : 'bg-slate-100 text-slate-700 dark:bg-stone-800 dark:text-stone-300'}`}>
                        {solicitud.estado}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600 dark:text-stone-300">{solicitud.correo} · Usuario: {solicitud.usuario}</p>
                    <p className="mt-1 text-xs text-slate-500">Enviada: {new Date(solicitud.created_at).toLocaleString('es')}</p>
                  </div>

                  {solicitud.estado === 'PENDIENTE' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`rol-${solicitud.id}`}>Rol de la cuenta</label>
                      <select
                        id={`rol-${solicitud.id}`}
                        className="h-10 rounded-xl border bg-white px-3 text-sm dark:border-[#39334b] dark:bg-[#191625]"
                        value={rol}
                        onChange={(event) => setRoles((actuales) => ({ ...actuales, [solicitud.id]: event.target.value as RolCuenta }))}
                      >
                        <option value="Docente">Docente</option>
                        <option value="Administrador">Administrador</option>
                      </select>
                      <button
                        type="button"
                        disabled={ocupada === solicitud.id || (rol === 'Docente' && !puedeAprobar(solicitud))}
                        onClick={() => void revisar(solicitud, 'aprobar')}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={ocupada === solicitud.id}
                        onClick={() => void revisar(solicitud, 'rechazar')}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-800 hover:bg-red-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/30 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" /> Rechazar
                      </button>
                    </div>
                  )}
                </div>

                {solicitud.estado === 'PENDIENTE' && rol === 'Docente' && (
                  <div className="mt-5 border-t border-[#ead7d7] pt-4 dark:border-[#39334b]">
                    <p className="text-sm font-medium">Vinculacion institucional</p>
                    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Como vincular a ${solicitud.nombre_completo}`}>
                      <button
                        type="button"
                        aria-pressed={modo === 'existente'}
                        onClick={() => setModosDocente((actuales) => ({ ...actuales, [solicitud.id]: 'existente' }))}
                        className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium ${modo === 'existente' ? 'border-[#65000b] bg-[#65000b] text-white dark:border-[#5e35b1] dark:bg-[#5e35b1]' : 'bg-white hover:bg-[#faf4f1] dark:border-[#39334b] dark:bg-[#191625] dark:hover:bg-[#302a43]'}`}
                      >
                        <UsersRound className="h-4 w-4" /> Ya existe en Docentes
                      </button>
                      <button
                        type="button"
                        aria-pressed={modo === 'nuevo'}
                        onClick={() => setModosDocente((actuales) => ({ ...actuales, [solicitud.id]: 'nuevo' }))}
                        className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium ${modo === 'nuevo' ? 'border-[#65000b] bg-[#65000b] text-white dark:border-[#5e35b1] dark:bg-[#5e35b1]' : 'bg-white hover:bg-[#faf4f1] dark:border-[#39334b] dark:bg-[#191625] dark:hover:bg-[#302a43]'}`}
                      >
                        <UserPlus className="h-4 w-4" /> Es un nuevo ingreso
                      </button>
                    </div>

                    {modo === 'existente' ? (
                      <div className="mt-3 max-w-xl">
                        <label className="mb-1 block text-xs text-slate-600 dark:text-stone-300" htmlFor={`docente-${solicitud.id}`}>
                          Selecciona su ficha; el codigo visible es el numero de empleado, no el ID interno.
                        </label>
                        <select
                          id={`docente-${solicitud.id}`}
                          className="h-10 w-full rounded-xl border bg-white px-3 text-sm dark:border-[#39334b] dark:bg-[#191625]"
                          value={docentesSeleccionados[solicitud.id] ?? ''}
                          onChange={(event) => setDocentesSeleccionados((actuales) => ({ ...actuales, [solicitud.id]: Number(event.target.value) }))}
                        >
                          <option value="">Selecciona un docente existente...</option>
                          {docentes.filter((docente) => docente.estado).map((docente) => (
                            <option key={docente.id} value={docente.id}>{docente.numero_empleado} · {docente.nombres} {docente.apellidos}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="text-xs font-medium text-slate-600 dark:text-stone-300">
                          Numero de empleado
                          <input
                            className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm dark:border-[#39334b] dark:bg-[#191625]"
                            placeholder="Ej. DOC-101"
                            value={docenteNuevo.numero_empleado}
                            onChange={(event) => actualizarDatoDocente(solicitud.id, 'numero_empleado', event.target.value)}
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600 dark:text-stone-300">
                          Nombres
                          <input
                            className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm dark:border-[#39334b] dark:bg-[#191625]"
                            value={docenteNuevo.nombres}
                            onChange={(event) => actualizarDatoDocente(solicitud.id, 'nombres', event.target.value)}
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600 dark:text-stone-300">
                          Apellidos
                          <input
                            className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm dark:border-[#39334b] dark:bg-[#191625]"
                            value={docenteNuevo.apellidos}
                            onChange={(event) => actualizarDatoDocente(solicitud.id, 'apellidos', event.target.value)}
                          />
                        </label>
                        <p className="text-xs text-slate-500 sm:col-span-2 lg:col-span-3">
                          El correo institucional se toma de la solicitud. El numero DOC es un codigo institucional; el ID de base de datos se genera automaticamente.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
