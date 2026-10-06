import { Bot, Send, X } from 'lucide-react'
import { useState } from 'react'
import { enviarMensajeChatbot } from '../../services/api'

interface Mensaje { rol: 'usuario' | 'asistente'; texto: string }

// Muestra una conversacion minima para la primera herramienta.
export function ChatbotPanel({ onClose }: { onClose: () => void }) {
  // Guarda el texto que el usuario esta escribiendo.
  const [entrada, setEntrada] = useState('')
  // Guarda todo el historial visible de la conversacion.
  const [historial, setHistorial] = useState<Mensaje[]>([{ rol: 'asistente', texto: 'Pregunta cuántos estudiantes activos hay.' }])
  // Indica si existe una consulta en proceso.
  const [cargando, setCargando] = useState(false)
  // Envia la pregunta al backend.
  const enviar = async () => {
    // Elimina espacios innecesarios del mensaje.
    const mensaje = entrada.trim()
    // Evita enviar mensajes vacios o consultas duplicadas.
    if (!mensaje || cargando) return
    // Muestra inmediatamente el mensaje del usuario.
    setHistorial((actual) => [...actual, { rol: 'usuario', texto: mensaje }])
    // Limpia el campo de entrada.
    setEntrada('')
    // Activa el estado visual de carga.
    setCargando(true)
    try {
      // Espera la respuesta real de FastAPI.
      const resultado = await enviarMensajeChatbot(mensaje)
      // Agrega la respuesta del agente al historial.
      setHistorial((actual) => [...actual, { rol: 'asistente', texto: resultado.respuesta }])
    } catch {
      // Muestra un error entendible si el backend no responde.
      setHistorial((actual) => [...actual, { rol: 'asistente', texto: 'No se pudo consultar el asistente.' }])
    } finally {
      // Termina el estado visual de carga.
      setCargando(false)
    }
  }
  // Renderiza la ventana flotante del agente.
  return <section className="fixed bottom-5 right-5 z-50 flex h-[min(34rem,calc(100vh-2rem))] w-[min(30rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-[#fffdf8] shadow-2xl dark:border-stone-700 dark:bg-stone-900" role="dialog" aria-label="Asistente academico"><header className="flex items-center justify-between bg-[#5b0309] px-4 py-3 text-white"><div className="flex items-center gap-2"><Bot className="h-5 w-5" /><strong>Asistente academico</strong></div><button type="button" onClick={onClose} aria-label="Cerrar asistente"><X className="h-4 w-4" /></button></header><div className="flex-1 space-y-3 overflow-y-auto p-4">{historial.map((item, indice) => <p className={item.rol === 'usuario' ? 'ml-8 rounded-xl bg-[#5b0309] p-3 text-sm text-white' : 'mr-8 rounded-xl bg-[#f5ebe8] p-3 text-sm dark:bg-stone-800 dark:text-stone-200'} key={indice}>{item.texto}</p>)}{cargando && <p className="mr-8 rounded-xl bg-[#f5ebe8] p-3 text-sm dark:bg-stone-800">Consultando estudiantes...</p>}</div><div className="flex gap-2 border-t p-3"><input className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950" value={entrada} onChange={(event) => setEntrada(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void enviar() }} placeholder="Cuantos estudiantes activos hay?" /><button className="rounded-xl bg-[#5b0309] px-3 text-white disabled:opacity-50" type="button" onClick={() => void enviar()} disabled={cargando} aria-label="Enviar pregunta"><Send className="h-4 w-4" /></button></div></section>
}
