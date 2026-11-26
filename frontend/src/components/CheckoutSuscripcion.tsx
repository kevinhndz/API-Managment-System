import { initializePaddle } from '@paddle/paddle-js'
import { useEffect, useState } from 'react'

import { formatearImporte } from '../lib/moneda'
import { iniciarCheckoutInstitucional, listarPlanesPublicos, obtenerSuscripcionInstitucional, type SuscripcionInstitucional } from '../services/api'

interface Props {
  suscripcion: SuscripcionInstitucional
  onActualizada: () => Promise<void>
}

export function CheckoutSuscripcion({ suscripcion, onActualizada }: Props) {
  const [planes, setPlanes] = useState<Awaited<ReturnType<typeof listarPlanesPublicos>>>([])
  const [plan, setPlan] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [esperando, setEsperando] = useState(suscripcion.checkout_pending)
  const [pendiente, setPendiente] = useState(suscripcion.checkout_pending)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    let activo = true
    void listarPlanesPublicos().then((opciones) => {
      if (!activo) return
      const mensuales = opciones.filter((opcion) => opcion.disponible && opcion.intervalo === 'month')
      setPlanes(mensuales)
      setPlan(mensuales.find((opcion) => opcion.nombre === suscripcion.plan_name)?.nombre ?? mensuales[0]?.nombre ?? '')
    }).catch(() => { if (activo) setError('No se pudieron cargar los planes. Actualiza la pagina para intentar de nuevo.') })
    return () => { activo = false }
  }, [suscripcion.plan_name])

  useEffect(() => {
    if (!esperando) return
    let activo = true
    let consultas = 0
    const intervalo = window.setInterval(() => {
      void obtenerSuscripcionInstitucional().then((actual) => {
        if (!activo) return
        if (actual.active && actual.has_paddle_subscription && actual.status !== 'CANCELADA') {
          setEsperando(false)
          setMensaje('Pago confirmado. Tu suscripcion ya esta vigente.')
          void onActualizada()
        }
      }).catch(() => { if (activo) setMensaje('El pago esta pendiente de confirmacion. Puedes comprobarlo de nuevo.') })
      consultas += 1
      if (consultas >= 24) {
        setEsperando(false)
        setMensaje('La confirmacion esta tardando. Pulsa Comprobar pago para consultar el estado sin pagar otra vez.')
      }
    }, 5000)
    return () => { activo = false; window.clearInterval(intervalo) }
  }, [esperando, onActualizada])

  async function pagar() {
    setOcupado(true); setError(''); setMensaje('')
    try {
      const checkout = await iniciarCheckoutInstitucional(plan)
      setPendiente(true)
      const paddle = await initializePaddle({ token: checkout.client_token, environment: checkout.environment,
        eventCallback: (evento) => {
          if (evento.name === 'checkout.completed') {
            setError('')
            setMensaje('Pago recibido. Estamos esperando la confirmacion de tu suscripcion.')
            setEsperando(true)
          } else if (evento.name === 'checkout.error' || evento.name === 'checkout.payment.failed') {
            setError('No se pudo completar el pago. Puedes continuar el checkout para intentarlo de nuevo.')
          }
        },
      })
      if (!paddle) throw new Error('No se pudo abrir el formulario de pago. Intenta de nuevo.')
      paddle.Checkout.open({ transactionId: checkout.transaction_id, settings: { displayMode: 'overlay', theme: 'light' } })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar el pago.')
    } finally { setOcupado(false) }
  }

  return <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-6" aria-label="Activar suscripcion">
    <h2 className="text-xl font-semibold">{suscripcion.status === 'CANCELADA' ? 'Renovar suscripcion' : 'Activar plan mensual'}</h2>
    <p className="mt-2 text-sm text-slate-600">Paga aqui con el formulario seguro de Paddle. El plan se renueva cada mes; puedes cancelar la renovacion desde tu cuenta.</p>
    {planes.length ? <label className="mt-4 block text-sm font-semibold">Plan mensual<select className="mt-2 block w-full rounded-xl border bg-white p-3" value={plan} onChange={(evento) => setPlan(evento.target.value)} disabled={ocupado || pendiente}>
      {planes.map((opcion) => <option key={opcion.nombre} value={opcion.nombre}>{opcion.nombre} — {formatearImporte(opcion.importe, opcion.moneda)} / mes</option>)}
    </select></label> : <p className="mt-4 text-sm">No hay planes mensuales disponibles para contratar en este momento.</p>}
    <div className="mt-5 flex flex-wrap gap-3">
      <button className="rounded-full bg-violet-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" type="button" disabled={ocupado || !plan} onClick={() => void pagar()}>{ocupado ? 'Preparando pago...' : pendiente ? 'Continuar pago' : 'Pagar plan mensual'}</button>
      {pendiente && <button className="rounded-full border border-violet-300 px-5 py-3 text-sm font-semibold text-violet-700" type="button" onClick={() => { setEsperando(true); void onActualizada() }}>Comprobar pago</button>}
    </div>
    {esperando && <p className="mt-4 text-sm" role="status">Esperando confirmacion del pago. El acceso se actualizara automaticamente.</p>}
    {mensaje && <p className="mt-4 text-sm" role="status">{mensaje}</p>}
    {error && <p className="mt-4 text-sm text-red-800" role="alert">{error}</p>}
  </section>
}
