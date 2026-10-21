import { useEffect, useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import { ArrowUpRight, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react'

import { abrirPortalInstitucional, iniciarCheckoutInstitucional, obtenerSuscripcionInstitucional, type SuscripcionInstitucional } from '../services/api'

function fecha(valor: string | null) {
  return valor ? new Intl.DateTimeFormat('es-HN', { dateStyle: 'long' }).format(new Date(valor)) : 'Sin fecha disponible'
}

export function PlanesPage() {
  const [suscripcion, setSuscripcion] = useState<SuscripcionInstitucional | null>(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  async function recargar() {
    try { setSuscripcion(await obtenerSuscripcionInstitucional()); setError('') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo consultar la suscripcion.') }
    finally { setCargando(false) }
  }

  useEffect(() => { void recargar() }, [])

  async function contratar() {
    setOcupado(true)
    setError('')
    try {
      const checkout = await iniciarCheckoutInstitucional()
      const paddle: Paddle | undefined = await initializePaddle({ token: checkout.client_token, environment: checkout.environment })
      if (!paddle) throw new Error('No se pudo abrir Paddle Checkout.')
      paddle.Checkout.open({ transactionId: checkout.transaction_id, settings: { displayMode: 'overlay', theme: 'light' } })
      await recargar()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar el pago.') }
    finally { setOcupado(false) }
  }

  async function administrar() {
    setOcupado(true)
    setError('')
    try {
      const { url } = await abrirPortalInstitucional()
      window.location.assign(url)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo abrir el portal de Paddle.'); setOcupado(false) }
  }

  const tienePaddle = suscripcion?.has_paddle_subscription
  const puedeContratar = suscripcion?.can_manage && !tienePaddle && (suscripcion.status === 'PRUEBA' || !suscripcion.active)

  return <div className="mx-auto max-w-4xl space-y-7">
    <header><p className="text-sm font-semibold text-sage-600 dark:text-sage-400">Administracion</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy-950 dark:text-white">Suscripcion de la universidad</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">El plan pertenece a la institucion y cubre a sus usuarios autorizados.</p></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
    {cargando ? <p role="status" className="text-sm text-slate-500">Consultando suscripcion...</p> : <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fffdf8] dark:border-white/10 dark:bg-[#242033]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-white/10"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-sage-700 dark:text-sage-400">Plan institucional</p><h2 className="mt-2 text-2xl font-semibold text-navy-950 dark:text-white">{suscripcion?.plan_name ?? 'Sin plan'}</h2></div><span className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${suscripcion?.active ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'}`}>{suscripcion?.status ?? 'SIN_PLAN'}</span></div>
        <div className="grid gap-5 p-6 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wide text-slate-500">Periodo actual</p><p className="mt-1 font-medium dark:text-white">{fecha(suscripcion?.current_period_start ?? null)} — {fecha(suscripcion?.current_period_end ?? null)}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-500">Proxima renovacion</p><p className="mt-1 font-medium dark:text-white">{suscripcion?.cancel_at_period_end ? 'Cancelacion programada al terminar el periodo' : fecha(suscripcion?.current_period_end ?? null)}</p></div></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-slate-100 p-5 dark:bg-white/5"><ShieldCheck className="h-6 w-6 text-sage-600" /><h3 className="mt-3 font-semibold dark:text-white">Acceso compartido</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">La suscripcion habilita las funciones premium para los usuarios permitidos de esta universidad.</p></div><div className="rounded-xl bg-slate-100 p-5 dark:bg-white/5"><CheckCircle2 className="h-6 w-6 text-sage-600" /><h3 className="mt-3 font-semibold dark:text-white">Estado confirmado por Paddle</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">El acceso cambia despues de recibir la confirmacion segura del pago.</p></div></section>
      {!suscripcion?.active && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Esta universidad no tiene acceso premium vigente. El administrador puede contratar o revisar la suscripcion existente.</p>}
      {puedeContratar && <button type="button" disabled={ocupado} onClick={() => void contratar()} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 font-semibold text-white disabled:opacity-50 dark:bg-violet-700"><CreditCard className="h-5 w-5" />{ocupado ? 'Preparando checkout...' : suscripcion.checkout_pending ? 'Continuar pago' : 'Suscribir universidad'}</button>}
      {suscripcion?.can_manage && tienePaddle && <button type="button" disabled={ocupado} onClick={() => void administrar()} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 font-semibold text-white disabled:opacity-50 dark:bg-violet-700">Administrar o cancelar en Paddle <ArrowUpRight className="h-5 w-5" /></button>}
      {!suscripcion?.can_manage && <p className="text-sm text-slate-500">Solo el administrador de la universidad puede contratar o administrar este plan.</p>}
      <button type="button" onClick={() => void recargar()} className="block text-sm font-semibold text-violet-700 dark:text-violet-300">Actualizar estado</button>
    </>}
  </div>
}
