import { useEffect, useState } from 'react'
import { abrirPortalInstitucional, cancelarSuscripcion, cambiarPlanSuscripcion, facturaSuscripcion, historialSuscripcion, listarPlanesPublicos, metodoPagoSuscripcion, obtenerSuscripcionInstitucional, reactivarSuscripcion, type SuscripcionInstitucional } from '../services/api'

type Movimiento = Awaited<ReturnType<typeof historialSuscripcion>>[number]
type Enlaces = Awaited<ReturnType<typeof abrirPortalInstitucional>>
const fecha = (valor: string | null | undefined) => valor ? new Intl.DateTimeFormat('es-HN', { dateStyle: 'medium' }).format(new Date(valor)) : 'No disponible'

export function PlanesPage() {
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
  return <div className="mx-auto max-w-5xl space-y-7"><header><p className="text-sm font-semibold text-sage-600">Administracion</p><h1 className="mt-1 text-3xl font-semibold dark:text-white">Suscripcion institucional</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Paddle gestiona el cobro recurrente. El estado se confirma mediante sus webhooks.</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{mensaje && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-900">{mensaje}</p>}
    {suscripcion ? <><section className="grid gap-4 rounded-2xl border bg-white p-6 dark:border-white/10 dark:bg-[#242033] dark:text-white sm:grid-cols-2"><div><p className="text-sm text-slate-500">Plan actual</p><h2 className="mt-1 text-2xl font-semibold">{suscripcion.plan_name || 'Sin plan'}</h2></div><div><p className="text-sm text-slate-500">Estado</p><p className="mt-1 text-xl font-semibold">{suscripcion.status}</p></div><div><p className="text-sm text-slate-500">Proximo cobro</p><p>{suscripcion.cancel_at_period_end ? 'Cancelacion programada' : fecha(suscripcion.current_period_end)}</p></div><div><p className="text-sm text-slate-500">Dias restantes</p><p>{dias ?? 'No disponible'}</p></div><div><p className="text-sm text-slate-500">Metodo de pago</p><p>{metodo?.last4 ? `${metodo.brand || metodo.type} terminada en ${metodo.last4}` : 'Consulta o cambia el metodo en Paddle'}</p></div></section>
      {!suscripcion.active && <p className="rounded-xl bg-amber-50 p-4 text-amber-900">Esta universidad no tiene acceso premium activo. Si el pago inicial esta pendiente, el representante puede continuar el alta desde la pagina publica de registro.</p>}
      {suscripcion.can_manage && suscripcion.has_paddle_subscription && <section className="space-y-4 rounded-2xl border bg-white p-6 dark:border-white/10 dark:bg-[#242033] dark:text-white"><h2 className="text-xl font-semibold">Administrar suscripcion</h2><button disabled={ocupado} onClick={() => void abrirEnlaces()} className="rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white">Abrir opciones de Paddle</button>{enlaces && <div className="flex flex-wrap gap-4 text-sm text-violet-700 dark:text-violet-300"><a href={enlaces.overview} target="_blank" rel="noreferrer">Ver suscripcion</a>{enlaces.payment_method && <a href={enlaces.payment_method} target="_blank" rel="noreferrer">Cambiar metodo de pago</a>}</div>}
        {suscripcion.active && !suscripcion.cancel_at_period_end && <button disabled={ocupado} onClick={() => void ejecutar(cancelarSuscripcion)} className="block rounded-xl border border-red-300 px-5 py-3 text-red-700 dark:text-red-300">Cancelar al final del periodo</button>}
        {suscripcion.cancel_at_period_end && <button disabled={ocupado} onClick={() => void ejecutar(reactivarSuscripcion)} className="block rounded-xl border px-5 py-3">Retirar cancelacion programada</button>}
        {suscripcion.active && !suscripcion.cancel_at_period_end && planes.filter((item) => item.nombre !== suscripcion.plan_name).length > 0 && <div className="flex flex-wrap gap-3"><select aria-label="Nuevo plan" value={planNuevo} onChange={(event) => setPlanNuevo(event.target.value)} className="rounded-xl border p-3 text-slate-900"><option value="">Selecciona otro plan</option>{planes.filter((item) => item.nombre !== suscripcion.plan_name).map((item) => <option key={item.nombre}>{item.nombre}</option>)}</select><button disabled={ocupado || !planNuevo} onClick={() => void ejecutar(() => cambiarPlanSuscripcion(planNuevo))} className="rounded-xl border px-5 py-3 disabled:opacity-50">Cambiar plan</button></div>}</section>}
      <section className="rounded-2xl border bg-white p-6 dark:border-white/10 dark:bg-[#242033] dark:text-white"><h2 className="text-xl font-semibold">Historial de transacciones</h2>{historial.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Fecha</th><th className="p-2">Estado</th><th className="p-2">Importe</th><th className="p-2">Factura</th></tr></thead><tbody>{historial.map((item) => <tr key={item.id} className="border-t"><td className="p-2">{fecha(item.created_at)}</td><td className="p-2">{item.status}</td><td className="p-2">{item.amount && item.currency ? `${item.amount} ${item.currency}` : 'No disponible'}</td><td className="p-2">{item.invoice_available ? <button className="text-violet-700 underline dark:text-violet-300" onClick={() => void abrirFactura(item.id)}>Ver recibo {item.invoice_number || ''}</button> : 'Pendiente'}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-sm text-slate-500">Aun no hay transacciones disponibles.</p>}</section><button onClick={() => void cargar()} className="text-sm font-semibold text-violet-700 dark:text-violet-300">Actualizar estado</button></> : <p>Cargando suscripcion...</p>}
  </div>
}
