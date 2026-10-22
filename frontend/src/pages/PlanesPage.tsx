import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Check, CreditCard, FileText, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { formatearImporte } from '../lib/moneda'
import { abrirPortalInstitucional, cancelarSuscripcion, cambiarPlanSuscripcion, facturaSuscripcion, historialSuscripcion, listarPlanesPublicos, metodoPagoSuscripcion, obtenerSlugInstitucion, obtenerSuscripcionInstitucional, reactivarSuscripcion, type SuscripcionInstitucional } from '../services/api'

type Movimiento = Awaited<ReturnType<typeof historialSuscripcion>>[number]
type Enlaces = Awaited<ReturnType<typeof abrirPortalInstitucional>>
const fecha = (valor: string | null | undefined) => valor ? new Intl.DateTimeFormat('es-HN', { dateStyle: 'medium' }).format(new Date(valor)) : 'No disponible'
const moduloIncluido = ['Reportes academicos y documentos', 'Bitacora de actividad', 'Estudiantes, docentes y asignaturas', 'Importacion de datos institucionales']

export function PlanesPage() {
  const { user } = useAuth()
  const reducir = useReducedMotion()
  const [suscripcion, setSuscripcion] = useState<SuscripcionInstitucional | null>(null)
  const [historial, setHistorial] = useState<Movimiento[]>([])
  const [metodo, setMetodo] = useState<{ type: string; brand: string | null; last4: string | null } | null>(null)
  const [planes, setPlanes] = useState<{ nombre: string }[]>([])
  const [enlaces, setEnlaces] = useState<Enlaces | null>(null)
  const [planNuevo, setPlanNuevo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  async function cargar() {
    try {
      const actual = await obtenerSuscripcionInstitucional()
      setSuscripcion(actual); setError('')
      if (actual.can_manage && actual.has_paddle_subscription) {
        const [movimientos, forma, opciones] = await Promise.allSettled([historialSuscripcion(), metodoPagoSuscripcion(), listarPlanesPublicos()])
        if (movimientos.status === 'fulfilled') setHistorial(movimientos.value)
        if (forma.status === 'fulfilled') setMetodo(forma.value.method)
        if (opciones.status === 'fulfilled') setPlanes(opciones.value)
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cargar la suscripcion.') }
  }
  useEffect(() => { void cargar() }, [])
  async function ejecutar(accion: () => Promise<{ detail: string }>) {
    setOcupado(true); setError(''); setMensaje('')
    try { setMensaje((await accion()).detail); await cargar() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo completar la solicitud.') }
    finally { setOcupado(false) }
  }
  async function abrirEnlaces() {
    setOcupado(true)
    try { setEnlaces(await abrirPortalInstitucional()) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo abrir Paddle.') }
    finally { setOcupado(false) }
  }
  async function abrirFactura(id: string) {
    try { const { url } = await facturaSuscripcion(id); window.open(url, '_blank', 'noopener,noreferrer') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Factura no disponible.') }
  }
  const dias = suscripcion?.current_period_end ? Math.max(0, Math.ceil((new Date(suscripcion.current_period_end).getTime() - Date.now()) / 86400000)) : null
  const acciones = Boolean(suscripcion?.can_manage && suscripcion.has_paddle_subscription)
  return <div className="mx-auto max-w-6xl space-y-7">
    <header><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-700 dark:text-violet-300">Cuenta institucional</p><h1 className="mt-2 text-3xl font-semibold tracking-tight dark:text-white">Suscripcion y facturacion</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Gestiona el plan de tu universidad y consulta sus cobros en un solo lugar.</p></header>
    {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}{mensaje && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{mensaje}</p>}
    {!suscripcion ? <p role="status" className="rounded-3xl border bg-white/80 p-8 dark:border-white/10 dark:bg-[#242033]">Cargando suscripcion...</p> : <motion.div initial={reducir ? { opacity: 0 } : { opacity: 0, transform: 'translateY(18px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }} className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_30px_70px_-46px_rgba(42,27,73,.5)] backdrop-blur-xl dark:border-white/10 dark:bg-[#242033]/85 sm:p-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-violet-300/15 blur-3xl dark:bg-violet-500/10" />
      <div className="relative mb-8 flex flex-wrap items-start justify-between gap-4"><div><span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[.16em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">CampusFlow</span><h2 className="mt-3 text-2xl font-semibold dark:text-white">Tu cuenta y plan institucional</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Una suscripcion compartida por los usuarios autorizados de esta universidad.</p></div><span className={`rounded-full border px-4 py-2 text-sm font-semibold ${suscripcion.active ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'}`}>{suscripcion.status}</span></div>
      <div className="relative grid gap-5 lg:grid-cols-[2fr_3fr]"><div className="space-y-5"><section className="rounded-2xl border border-slate-200/80 bg-slate-50/65 p-6 dark:border-white/10 dark:bg-[#1c1928]/55"><ShieldCheck className="size-5 text-violet-600 dark:text-violet-300" aria-hidden="true" /><h3 className="mt-3 font-semibold dark:text-white">Cuenta y seguridad</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Datos del administrador actual</p><dl className="mt-5 space-y-4 text-sm"><div><dt className="font-medium text-slate-500 dark:text-slate-400">Universidad</dt><dd className="mt-1 dark:text-white">{obtenerSlugInstitucion()}</dd></div><div><dt className="font-medium text-slate-500 dark:text-slate-400">Correo</dt><dd className="mt-1 break-all dark:text-white">{user?.email || 'No registrado'}</dd></div></dl></section>
        <section className="rounded-2xl border border-slate-200/80 bg-slate-50/65 p-6 dark:border-white/10 dark:bg-[#1c1928]/55"><CreditCard className="size-5 text-violet-600 dark:text-violet-300" aria-hidden="true" /><h3 className="mt-3 font-semibold dark:text-white">Metodo de pago</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{metodo?.last4 ? `${metodo.brand || metodo.type} terminada en ${metodo.last4}` : 'Los datos de pago se consultan en Paddle.'}</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">CampusFlow no guarda los numeros de tu tarjeta.</p>{acciones && <button type="button" disabled={ocupado} onClick={() => void abrirEnlaces()} className="mt-5 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-violet-700 transition-colors duration-150 hover:bg-violet-50 disabled:opacity-50 dark:border-white/20 dark:text-violet-300 dark:hover:bg-white/5">Ver opciones de pago</button>}{enlaces?.payment_method && <a href={enlaces.payment_method} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-300">Cambiar metodo en Paddle <ArrowUpRight className="size-4" /></a>}</section></div>
        <div className="space-y-5"><section className="rounded-2xl border border-slate-200/80 bg-slate-50/65 p-6 dark:border-white/10 dark:bg-[#1c1928]/55"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Plan actual</p><h3 className="mt-2 text-2xl font-semibold dark:text-white">{suscripcion.plan_name || 'Sin plan'}</h3></div><span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">{suscripcion.cancel_at_period_end ? 'Cancelacion programada' : 'Renovacion automatica'}</span></div><div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 text-sm dark:border-white/10 sm:grid-cols-2"><div><p className="text-slate-500 dark:text-slate-400">Proximo cobro</p><p className="mt-1 font-semibold dark:text-white">{suscripcion.cancel_at_period_end ? 'No se renovara' : fecha(suscripcion.current_period_end)}</p></div><div><p className="text-slate-500 dark:text-slate-400">Dias restantes</p><p className="mt-1 font-semibold dark:text-white">{dias ?? 'No disponible'}</p></div></div><div className="mt-6 space-y-3">{moduloIncluido.map((texto) => <p key={texto} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300"><Check className="size-3" /></span>{texto}</p>)}</div>
          {acciones && <div className="mt-7 flex flex-wrap gap-3"><button type="button" disabled={ocupado} onClick={() => void abrirEnlaces()} className="rounded-full bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-violet-600 disabled:opacity-50">Administrar plan</button>{suscripcion.active && !suscripcion.cancel_at_period_end && <button type="button" disabled={ocupado} onClick={() => void ejecutar(cancelarSuscripcion)} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:border-red-300 hover:text-red-700 disabled:opacity-50 dark:border-white/20 dark:text-slate-200">Cancelar al final del periodo</button>}{suscripcion.cancel_at_period_end && <button type="button" disabled={ocupado} onClick={() => void ejecutar(reactivarSuscripcion)} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-white/20 dark:text-white">Retirar cancelacion</button>}</div>}{enlaces?.overview && <a href={enlaces.overview} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-300">Abrir portal seguro de Paddle <ArrowUpRight className="size-4" /></a>}
          {acciones && suscripcion.active && !suscripcion.cancel_at_period_end && planes.some((opcion) => opcion.nombre !== suscripcion.plan_name) && <div className="mt-5 flex flex-wrap gap-2"><select aria-label="Nuevo plan" value={planNuevo} onChange={(evento) => setPlanNuevo(evento.target.value)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900"><option value="">Otro plan</option>{planes.filter((opcion) => opcion.nombre !== suscripcion.plan_name).map((opcion) => <option key={opcion.nombre}>{opcion.nombre}</option>)}</select><button type="button" disabled={ocupado || !planNuevo} onClick={() => void ejecutar(() => cambiarPlanSuscripcion(planNuevo))} className="rounded-full border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-700 disabled:opacity-50 dark:text-violet-300">Solicitar cambio</button></div>}</section>
          <section className="rounded-2xl border border-slate-200/80 bg-slate-50/65 p-6 dark:border-white/10 dark:bg-[#1c1928]/55"><FileText className="size-5 text-violet-600 dark:text-violet-300" aria-hidden="true" /><h3 className="mt-3 font-semibold dark:text-white">Facturacion</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Revisa transacciones y descarga los recibos disponibles.</p><a href="#historial-suscripcion" className="mt-4 inline-block rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-violet-700 transition-colors duration-150 hover:bg-violet-50 dark:border-white/20 dark:text-violet-300">Ver historial</a></section></div></div>
    </motion.div>}
    {suscripcion && !suscripcion.active && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Esta universidad no tiene acceso premium vigente. El pago inicial solo se realiza durante el registro de una universidad nueva.</p>}
    <section id="historial-suscripcion" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-white/10 dark:bg-[#242033] dark:text-white sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Facturacion</p><h2 className="mt-2 text-xl font-semibold">Historial de transacciones</h2></div><button type="button" onClick={() => void cargar()} className="text-sm font-semibold text-violet-700 dark:text-violet-300">Actualizar</button></div>{historial.length ? <div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Fecha</th><th className="p-3">Estado</th><th className="p-3">Importe</th><th className="p-3">Factura</th></tr></thead><tbody>{historial.map((item) => <tr key={item.id} className="border-t border-slate-200 dark:border-white/10"><td className="p-3">{fecha(item.created_at)}</td><td className="p-3">{item.status}</td><td className="p-3">{formatearImporte(item.amount, item.currency)}</td><td className="p-3">{item.invoice_available ? <button type="button" className="font-semibold text-violet-700 underline dark:text-violet-300" onClick={() => void abrirFactura(item.id)}>Ver recibo {item.invoice_number || ''}</button> : 'Pendiente'}</td></tr>)}</tbody></table></div> : <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Aun no hay transacciones disponibles.</p>}</section>
  </div>
}
