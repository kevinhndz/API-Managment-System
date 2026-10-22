import { useEffect, useState, type FormEvent } from 'react'
import { initializePaddle } from '@paddle/paddle-js'
import { Link } from 'react-router-dom'
import { consultarAltaUniversidad, listarPlanesPublicos, reanudarAltaUniversidad, registrarUniversidad, seleccionarInstitucion, type AltaUniversidad } from '../services/api'

const claveAlta = 'campusflow.altaUniversidad'
const claseCampo = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-violet-500'

export function RegistroUniversidadPage() {
  const [planes, setPlanes] = useState<{ nombre: string; importe: string | null; moneda: string | null; intervalo: string | null }[]>([])
  const [plan, setPlan] = useState('')
  const [alta, setAlta] = useState<AltaUniversidad | null>(null)
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => {
    void listarPlanesPublicos().then((items) => { setPlanes(items); setPlan(items[0]?.nombre ?? '') }).catch((reason) => setError(String(reason)))
    const token = localStorage.getItem(claveAlta)
    if (token) void reanudarAltaUniversidad(token).then((dato) => { setAlta(dato); setEstado(dato.status) }).catch(() => localStorage.removeItem(claveAlta))
  }, [])
  useEffect(() => {
    if (!alta) return
    const consultar = () => void consultarAltaUniversidad(alta.token).then((dato) => { setEstado(dato.status); if (dato.active) seleccionarInstitucion(dato.slug) }).catch(() => undefined)
    consultar()
    const intervalo = window.setInterval(consultar, 5000)
    return () => window.clearInterval(intervalo)
  }, [alta])
  async function abrirCheckout(datos: AltaUniversidad) {
    const paddle = await initializePaddle({ token: datos.client_token, environment: datos.environment })
    if (!paddle) throw new Error('No se pudo abrir Paddle Checkout.')
    paddle.Checkout.open({ transactionId: datos.transaction_id, settings: { displayMode: 'overlay', theme: 'light' } })
  }
  async function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(''); setOcupado(true)
    const formulario = new FormData(evento.currentTarget)
    try {
      const datos = await registrarUniversidad({ slug: String(formulario.get('slug')).trim().toLowerCase(), nombre_institucion: formulario.get('nombre_institucion'), nombre_administrador: formulario.get('nombre_administrador'), correo_administrador: formulario.get('correo_administrador'), usuario_administrador: formulario.get('usuario_administrador'), contrasena: formulario.get('contrasena'), plan })
      localStorage.setItem(claveAlta, datos.token)
      setAlta(datos); setEstado(datos.status)
      await abrirCheckout(datos)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo registrar la universidad.') }
    finally { setOcupado(false) }
  }
  return <main className="min-h-screen bg-[#f7f6f2] px-4 py-12 text-slate-900"><div className="mx-auto max-w-3xl space-y-8">
    <header><Link to="/login" className="text-sm font-semibold text-violet-700">CampusFlow</Link><h1 className="mt-5 text-4xl font-semibold">Registra tu universidad</h1><p className="mt-3 text-slate-600">Crea una institucion independiente, elige un plan y completa el primer pago seguro en Paddle.</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {alta ? <section className="rounded-2xl border bg-white p-7 shadow-sm"><h2 className="text-2xl font-semibold">Registro en proceso</h2><p className="mt-3">Universidad: {alta.slug}</p><p>Estado: {estado || 'PENDIENTE'}</p>{estado === 'ACTIVA' ? <p className="mt-4 text-emerald-800">Paddle confirmo el pago. <Link className="underline" to="/iniciar-sesion">Ingresa al campus</Link>.</p> : <><p className="mt-4 text-slate-600">Tu acceso se habilitara cuando Paddle confirme el pago. Esta pagina se actualiza automaticamente.</p><button type="button" onClick={() => void abrirCheckout(alta).catch((reason) => setError(String(reason)))} className="mt-5 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white">Continuar checkout inicial</button></>}</section> : <form onSubmit={(event) => void registrar(event)} className="space-y-6 rounded-2xl border bg-white p-7 shadow-sm"><fieldset><legend className="text-lg font-semibold">Plan institucional</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{planes.map((item) => <label key={item.nombre} className={`cursor-pointer rounded-xl border p-4 ${plan === item.nombre ? 'border-violet-700 bg-violet-50' : 'border-slate-200'}`}><input type="radio" name="plan" value={item.nombre} checked={plan === item.nombre} onChange={() => setPlan(item.nombre)} className="mr-3" />{item.nombre}<span className="mt-2 block text-sm text-slate-600">{item.importe && item.moneda ? `${(Number(item.importe) / 100).toFixed(2)} ${item.moneda}` : "Precio en Paddle"}{item.intervalo ? ` / ${item.intervalo === "month" ? "mes" : item.intervalo === "year" ? "ano" : item.intervalo}` : ""}</span></label>)}</div></fieldset>
      <div className="grid gap-4 sm:grid-cols-2"><label>Nombre de universidad<input className={claseCampo} name="nombre_institucion" required minLength={3} maxLength={200} /></label><label>Identificador de universidad<input className={claseCampo} name="slug" required minLength={3} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="universidad-ejemplo" /></label><label>Nombre del administrador propietario<input className={claseCampo} name="nombre_administrador" required minLength={3} maxLength={160} /></label><label>Correo del administrador<input className={claseCampo} name="correo_administrador" type="email" required /></label><label>Usuario del administrador<input className={claseCampo} name="usuario_administrador" required minLength={3} maxLength={80} /></label><label>Contrasena<input className={claseCampo} name="contrasena" type="password" required minLength={12} maxLength={72} autoComplete="new-password" /></label></div><button disabled={ocupado || !plan} className="rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white disabled:opacity-50">{ocupado ? 'Preparando registro...' : 'Crear universidad y abrir Paddle'}</button></form>}
  </div></main>
}
