import { Bot, Download, Send, X } from 'lucide-react'
import { useState } from 'react'
import { enviarMensajeChatbot, urlReporteChatbot } from '../../services/api'

interface ChatbotPanelProps { onClose: () => void }
interface Mensaje { rol: 'usuario' | 'asistente'; texto: string; filas?: Record<string, unknown>[]; archivo?: string | null }

function ResultadoTabla({ filas }: { filas: Record<string, unknown>[] }) {
  const columnas = Object.keys(filas[0] ?? {}).filter((columna) => columna !== 'id')
  return <div className="mt-3 overflow-x-auto rounded-lg border border-[#d9c2bc] bg-white/70 dark:bg-stone-950/50"><table className="w-full text-left text-xs"><thead><tr>{columnas.map((columna) => <th className="whitespace-nowrap px-3 py-2 font-semibold text-[#5b0309] dark:text-rose-200" key={columna}>{columna.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{filas.slice(0, 20).map((fila, indice) => <tr className="border-t border-[#eadbd8] dark:border-stone-800" key={indice}>{columnas.map((columna) => <td className="whitespace-nowrap px-3 py-2" key={columna}>{String(fila[columna] ?? '—')}</td>)}</tr>)}</tbody></table></div>
}

export function ChatbotPanel({ onClose }: ChatbotPanelProps) {
  const [mensaje, setMensaje] = useState('')
  const [historial, setHistorial] = useState<Mensaje[]>([{ rol: 'asistente', texto: 'Hola. Puedo buscar informacion academica, consultar estados y generar reportes Excel.' }])
  const [cargando, setCargando] = useState(false)
  const enviar = async () => {
    const consulta = mensaje.trim()
    if (!consulta || cargando) return
    setCargando(true); setHistorial((actual) => [...actual, { rol: 'usuario', texto: consulta }]); setMensaje('')
    try { const resultado = await enviarMensajeChatbot(consulta); setHistorial((actual) => [...actual, { rol: 'asistente', texto: resultado.respuesta, filas: resultado.filas, archivo: resultado.archivo }]) } catch { setHistorial((actual) => [...actual, { rol: 'asistente', texto: 'No pude consultar el sistema. Revisa que el backend y Ollama esten disponibles.' }]) } finally { setCargando(false) }
  }
  return <section className="fixed bottom-5 right-5 z-50 flex h-[min(42rem,calc(100vh-2rem))] w-[min(42rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#eadbd8] bg-[#fffdf8] shadow-2xl dark:border-stone-700 dark:bg-stone-900" role="dialog" aria-label="Asistente academico"><header className="flex items-center justify-between bg-[#5b0309] px-5 py-4 text-white"><div className="flex items-center gap-2"><Bot className="h-5 w-5" /><strong>Asistente academico</strong></div><button type="button" onClick={onClose} aria-label="Cerrar chatbot"><X className="h-4 w-4" /></button></header><div className="flex-1 space-y-4 overflow-y-auto p-5">{historial.map((item, indice) => <div key={`${item.rol}-${indice}`} className={item.rol === 'usuario' ? 'ml-10 rounded-2xl bg-[#5b0309] p-3 text-sm text-white' : 'mr-4 rounded-2xl bg-[#f5ebe8] p-3 text-sm leading-5 text-[#3c2928] dark:bg-stone-800 dark:text-stone-200'}><p>{item.texto}</p>{item.filas && item.filas.length > 0 && <ResultadoTabla filas={item.filas} />}{item.archivo && <a className="mt-3 flex items-center gap-2 rounded-xl border border-[#d9c2bc] p-3 text-sm font-semibold text-[#5b0309] dark:text-rose-200" href={urlReporteChatbot(item.archivo)} download><Download className="h-4 w-4" /> Descargar {item.archivo}</a>}</div>)}{cargando && <p className="mr-4 rounded-2xl bg-[#f5ebe8] p-3 text-sm text-[#3c2928]">Consultando informacion...</p>}</div><div className="flex gap-2 border-t p-4 dark:border-stone-700"><input className="focus-ring min-w-0 flex-1 rounded-xl border bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950" value={mensaje} onChange={(event) => setMensaje(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void enviar() }} placeholder="Ej. nota final de Maria Lopez cuenta 2026-0003" /><button className="focus-ring rounded-xl bg-[#5b0309] px-3 text-white disabled:opacity-50" type="button" onClick={() => void enviar()} disabled={cargando} aria-label="Enviar mensaje"><Send className="h-4 w-4" /></button></div></section>
}
