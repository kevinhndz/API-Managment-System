import { useEffect, useState, type FormEvent } from 'react'
import { finanzasApi, type CrearObligacionFinanciera, type ObligacionFinanciera } from '../services/api'
import { useAcademicLabels } from '../hooks/useAcademicLabels'
import { Modal } from '../components/ui/Modal'

const campo = 'mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm dark:border-white/20 dark:bg-[#191625]'
const fecha = () => new Date().toISOString().slice(0, 10)

export function FinanzasPage() {
  const labels = useAcademicLabels()
  const [tipo, setTipo] = useState<'ESTUDIANTE' | 'DOCENTE'>('ESTUDIANTE')
  const [mes, setMes] = useState('')
  const [estado, setEstado] = useState('')
  const [registros, setRegistros] = useState<ObligacionFinanciera[]>([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [pagar, setPagar] = useState<ObligacionFinanciera | null>(null)
  const [sujetoId, setSujetoId] = useState('')
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [venceEn, setVenceEn] = useState(fecha())
  const [referencia, setReferencia] = useState('')
  const [metodo, setMetodo] = useState('Transferencia')
  const [fechaPago, setFechaPago] = useState(fecha())
  const [ocupado, setOcupado] = useState(false)

  const recargar = async () => {
    setCargando(true)
    try { setRegistros(await finanzasApi.listar({ tipo, mes: mes || undefined, estado: estado || undefined })); setError('') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron consultar las finanzas.') }
    finally { setCargando(false) }
  }
  useEffect(() => { void recargar() }, [tipo, mes, estado])

  async function crear(evento: FormEvent) {
    evento.preventDefault()
    if (!sujetoId || !mes || !concepto || !monto) { setError('Completa la persona, mes, concepto y monto.'); return }
    setOcupado(true)
    try {
      const datos: CrearObligacionFinanciera = { tipo, mes, concepto, monto: Number(monto), moneda: 'HNL', vence_en: venceEn,
        ...(tipo === 'ESTUDIANTE' ? { estudiante_id: Number(sujetoId) } : { docente_id: Number(sujetoId) }) }
      await finanzasApi.crear(datos)
      setCrearAbierto(false); setConcepto(''); setMonto(''); setSujetoId(''); await recargar()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo crear la obligacion.') }
    finally { setOcupado(false) }
  }

  async function registrar(evento: FormEvent) {
    evento.preventDefault()
    if (!pagar) return
    setOcupado(true)
    try {
      await finanzasApi.registrarPago(pagar.id, { referencia, monto: Number(monto), fecha: fechaPago, metodo })
      setPagar(null); setMonto(''); setReferencia(''); await recargar()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo registrar el pago.') }
    finally { setOcupado(false) }
  }

  const total = registros.reduce((suma, item) => suma + Number(item.monto), 0)
  const pagado = registros.reduce((suma, item) => suma + Number(item.pagado), 0)
  const moneda = (valor: number) => new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(valor)
  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-sage-600">Administracion</p><h1 className="text-2xl font-semibold">Finanzas institucionales</h1><p className="text-sm text-slate-500">Registra cobros estudiantiles y pagos de nomina. La suscripcion del SaaS se gestiona por separado.</p></div><button type="button" className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white dark:bg-violet-700" onClick={() => { setError(''); setCrearAbierto(true) }}>Nueva obligacion</button></header>
    <div className="flex flex-wrap gap-3 rounded-2xl border bg-[#fffdf8] p-4 dark:border-white/10 dark:bg-[#242033]">
      <label className="text-sm">Tipo<select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value as 'ESTUDIANTE' | 'DOCENTE')}><option value="ESTUDIANTE">Cobros estudiantiles</option><option value="DOCENTE">Nomina docente</option></select></label>
      <label className="text-sm">Mes<input className={campo} type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></label>
      <label className="text-sm">Estado<select className={campo} value={estado} onChange={(e) => setEstado(e.target.value)}><option value="">Todos</option><option value="PENDIENTE">Pendiente</option><option value="VENCIDO">Vencido</option><option value="PARCIAL">Parcial</option><option value="PAGADO">Pagado</option></select></label>
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="grid gap-3 sm:grid-cols-3">{[['Obligaciones', moneda(total)], ['Pagado', moneda(pagado)], ['Saldo', moneda(total - pagado)]].map(([titulo, valor]) => <div key={titulo} className="rounded-2xl border bg-[#fffdf8] p-4 dark:border-white/10 dark:bg-[#242033]"><p className="text-xs text-slate-500">{titulo}</p><strong className="text-xl">{valor}</strong></div>)}</section>
    <section className="overflow-x-auto rounded-2xl border bg-[#fffdf8] dark:border-white/10 dark:bg-[#242033]"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500 dark:border-white/10">{['Codigo','Persona','Mes','Concepto','Monto','Pagado','Saldo','Vence','Estado','Accion'].map((x) => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>{registros.map((item) => <tr key={item.id} className="border-b dark:border-white/10"><td className="px-4 py-3">{item.codigo}</td><td className="px-4 py-3">{item.persona}</td><td className="px-4 py-3">{item.mes}</td><td className="px-4 py-3">{item.concepto}</td><td className="px-4 py-3">{moneda(Number(item.monto))}</td><td className="px-4 py-3">{moneda(Number(item.pagado))}</td><td className="px-4 py-3">{moneda(Number(item.saldo))}</td><td className="px-4 py-3">{item.vence_en}</td><td className="px-4 py-3">{item.estado}</td><td className="px-4 py-3">{Number(item.saldo) > 0 && <button type="button" className="font-semibold text-violet-700" onClick={() => { setError(''); setMonto(item.saldo); setPagar(item) }}>Registrar pago</button>}</td></tr>)}</tbody></table>{!cargando && registros.length === 0 && <p className="p-5 text-sm text-slate-500">No hay obligaciones registradas para estos filtros. No se puede asumir que alguien debe sin crear un cargo o nomina.</p>}{cargando && <p className="p-5 text-sm">Cargando...</p>}</section>
    <Modal open={crearAbierto} title="Nueva obligacion" onClose={() => setCrearAbierto(false)}><form className="grid gap-3 p-6" onSubmit={(e) => void crear(e)}><label className="text-sm">{tipo === 'ESTUDIANTE' ? 'Estudiante' : 'Docente'}<select className={campo} value={sujetoId} onChange={(e) => setSujetoId(e.target.value)} required><option value="">Selecciona una persona</option>{(tipo === 'ESTUDIANTE' ? labels.estudianteOptions : labels.docenteOptions).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="text-sm">Mes<input className={campo} type="month" value={mes} onChange={(e) => setMes(e.target.value)} required /></label><label className="text-sm">Concepto<input className={campo} value={concepto} onChange={(e) => setConcepto(e.target.value)} required /></label><label className="text-sm">Monto HNL<input className={campo} type="number" step="0.01" min="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required /></label><label className="text-sm">Fecha de vencimiento<input className={campo} type="date" value={venceEn} onChange={(e) => setVenceEn(e.target.value)} required /></label><button className="rounded-xl bg-navy-900 px-4 py-2 text-white" disabled={ocupado}>Guardar obligacion</button></form></Modal>
    <Modal open={pagar !== null} title={`Registrar pago: ${pagar?.persona ?? ''}`} description={`Saldo disponible: ${moneda(Number(pagar?.saldo ?? 0))}`} onClose={() => setPagar(null)}><form className="grid gap-3 p-6" onSubmit={(e) => void registrar(e)}><label className="text-sm">Referencia unica<input className={campo} value={referencia} onChange={(e) => setReferencia(e.target.value)} required /></label><label className="text-sm">Monto HNL<input className={campo} type="number" step="0.01" min="0.01" max={pagar?.saldo} value={monto} onChange={(e) => setMonto(e.target.value)} required /></label><label className="text-sm">Fecha<input className={campo} type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required /></label><label className="text-sm">Metodo<input className={campo} value={metodo} onChange={(e) => setMetodo(e.target.value)} required /></label><button className="rounded-xl bg-navy-900 px-4 py-2 text-white" disabled={ocupado}>Confirmar pago</button></form></Modal>
  </div>
}
