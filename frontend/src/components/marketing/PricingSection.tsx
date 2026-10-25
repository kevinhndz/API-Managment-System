import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, BookOpen, Check, ClipboardList, GraduationCap, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPlanesPublicos } from '../../services/api'
import { formatearImporte } from '../../lib/moneda'

export interface PlanPublico {
  nombre: string
  importe: string | null
  moneda: string | null
  intervalo: string | null
  disponible: boolean
}

const modulos = [
  { titulo: 'Reporteria academica', descripcion: 'Informes, historial y constancias', icono: BookOpen },
  { titulo: 'Gestion universitaria', descripcion: 'Estudiantes, docentes y asignaturas', icono: GraduationCap },
  { titulo: 'Bitacora e importacion', descripcion: 'Seguimiento y carga inicial de datos', icono: ClipboardList },
  { titulo: 'Datos independientes', descripcion: 'Cada universidad con su propio espacio', icono: ShieldCheck },
]

export function PricingSection({ mostrarRegistro = true }: { mostrarRegistro?: boolean }) {
  const [planes, setPlanes] = useState<PlanPublico[]>([])
  const [seleccion, setSeleccion] = useState('')
  const [error, setError] = useState('')
  const reducir = useReducedMotion()
  useEffect(() => {
    void listarPlanesPublicos().then((datos) => {
      if (!Array.isArray(datos)) throw new Error('Catalogo invalido')
      setPlanes(datos); setSeleccion(datos[0]?.nombre ?? '')
    }).catch(() => setError('No se pudieron cargar los planes en este momento.'))
  }, [])
  const actual = planes.find((plan) => plan.nombre === seleccion) ?? planes[0]
  return <section id="planes" aria-labelledby="planes-titulo" className="relative scroll-mt-20 bg-[#100d18] px-4 pb-24 pt-10 text-white sm:px-8 sm:pt-16">
    <div className="mx-auto max-w-5xl">
      <div className="mx-auto mb-10 max-w-2xl text-center"><span className="inline-flex rounded-full border border-violet-300/25 bg-violet-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-violet-200">Planes institucionales</span><h2 id="planes-titulo" className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Un campus mejor conectado</h2><p className="mt-4 text-sm leading-7 text-violet-100/70 sm:text-base">Una suscripcion para toda tu universidad. Elige un plan y crea tu institucion en unos pasos.</p></div>
      <motion.div initial={reducir ? { opacity: 0 } : { opacity: 0, transform: 'translateY(18px)' }} whileInView={{ opacity: 1, transform: 'translateY(0px)' }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }} className="grid overflow-hidden rounded-[2rem] border border-white/15 bg-[#211b30]/90 shadow-[0_28px_80px_-30px_rgba(0,0,0,.6)] backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr]">
        <div className="border-b border-white/10 p-6 sm:p-9 lg:border-b-0 lg:border-r"><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Lo que incluye</p><h3 className="mt-3 text-2xl font-semibold">El sistema completo para tu universidad</h3><p className="mt-2 text-sm leading-6 text-violet-100/65">Tus equipos trabajan dentro del mismo espacio institucional, con permisos por rol.</p><div className="mt-8 space-y-3">{modulos.map((modulo) => { const Icono = modulo.icono; return <div key={modulo.titulo} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-400/15 text-violet-200"><Icono className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-semibold">{modulo.titulo}</strong><small className="mt-1 block text-xs text-violet-100/55">{modulo.descripcion}</small></span><Check className="size-4 text-emerald-300" aria-hidden="true" /></div> })}</div></div>
        <div className="flex flex-col bg-[#2b233a]/90 p-6 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Tu plan</p><h3 className="mt-3 text-2xl font-semibold">Selecciona tu suscripcion</h3><p className="mt-2 text-sm leading-6 text-violet-100/65">El cobro recurrente y los recibos se administran de forma segura en Paddle.</p>{error && <p role="status" className="mt-6 text-sm text-amber-200">{error}</p>}
          {planes.length > 1 && <div role="group" aria-label="Seleccionar plan" className="mt-7 flex flex-wrap gap-2">{planes.map((plan) => <button key={plan.nombre} type="button" aria-pressed={actual?.nombre === plan.nombre} onClick={() => setSeleccion(plan.nombre)} className={`rounded-full border px-4 py-2 text-sm transition-colors duration-150 ${actual?.nombre === plan.nombre ? 'border-violet-300 bg-violet-300/20 text-white' : 'border-white/15 text-violet-100/70 hover:border-violet-300/50'}`}>{plan.nombre}</button>)}</div>}
          <div className="mt-9 min-h-28"><p className="text-sm font-medium text-violet-100/65">{actual?.nombre ?? 'Plan institucional'}</p><AnimatePresence mode="wait"><motion.div key={`${actual?.nombre}-${actual?.importe}`} initial={reducir ? { opacity: 0 } : { opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} exit={reducir ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-8px)' }} transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }} className="mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">{actual ? formatearImporte(actual.importe, actual.moneda) : '—'}</motion.div></AnimatePresence><p className="mt-2 text-sm text-violet-100/55">{actual?.intervalo === 'month' ? 'Por mes, por universidad' : actual?.intervalo === 'year' ? 'Por ano, por universidad' : 'Precio por universidad'}</p></div>
          <div className="mt-auto pt-8">{mostrarRegistro && <Link to={actual ? `/registrar-universidad?plan=${encodeURIComponent(actual.nombre)}` : '/registrar-universidad'} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-6 py-3.5 font-semibold text-white transition-colors duration-150 hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200">Registrar universidad <ArrowUpRight className="size-4" aria-hidden="true" /></Link>}<p className="mt-4 text-center text-xs text-violet-100/45">{actual?.disponible ? 'Pago inicial seguro con Paddle Sandbox' : 'El pago se habilitara al completar la configuracion de Paddle'}</p></div>
        </div>
      </motion.div>
    </div>
  </section>
}
