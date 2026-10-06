import { Bot, Download, Send, X } from 'lucide-react'
import { useState } from 'react'
import { enviarMensajeChatbot, urlReporteChatbot } from '../../services/api'

interface ChatbotPanelProps { onClose: () => void }

export function ChatbotPanel({ onClose }: ChatbotPanelProps) {
  const [mensaje, setMensaje] = useState('')
  const [respuesta, setRespuesta] = useState('Hola. Puedo consultar docentes, estudiantes y matriculas, o generar reportes Excel.')
  const [archivo, setArchivo] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const enviar = async () => {
    if (!mensaje.trim() || cargando) return
    setCargando(true)
    try { const resultado = await enviarMensajeChatbot(mensaje); setRespuesta(resultado.respuesta); setArchivo(resultado.archivo) } catch { setRespuesta('No pude consultar el sistema. Revisa que el backend este disponible.') } finally { setCargando(false) }
    setMensaje('')
  }

  return <section className="fixed bottom-5 right-5 z-50 flex w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#eadbd8] bg-[#fffdf8] shadow-2xl dark:border-stone-700 dark:bg-stone-900" role="dialog" aria-label="Asistente academico"><header className="flex items-center justify-between bg-[#5b0309] px-4 py-3 text-white"><div className="flex items-center gap-2"><Bot className="h-5 w-5" /><strong>Asistente academico</strong></div><button type="button" onClick={onClose} aria-label="Cerrar chatbot"><X className="h-4 w-4" /></button></header><div className="max-h-80 space-y-3 overflow-y-auto p-4"><p className="rounded-xl bg-[#f5ebe8] p-3 text-sm leading-5 text-[#3c2928] dark:bg-stone-800 dark:text-stone-200">{respuesta}</p>{archivo && <a className="flex items-center gap-2 rounded-xl border border-[#d9c2bc] p-3 text-sm font-semibold text-[#5b0309] dark:text-rose-200" href={urlReporteChatbot(archivo)} download><Download className="h-4 w-4" /> Descargar {archivo}</a>}</div><div className="flex gap-2 border-t p-3 dark:border-stone-700"><input className="focus-ring min-w-0 flex-1 rounded-xl border bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950" value={mensaje} onChange={(event) => setMensaje(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void enviar() }} placeholder="Ej. docentes inactivos" /><button className="focus-ring rounded-xl bg-[#5b0309] px-3 text-white disabled:opacity-50" type="button" onClick={() => void enviar()} disabled={cargando} aria-label="Enviar mensaje"><Send className="h-4 w-4" /></button></div></section>
}
