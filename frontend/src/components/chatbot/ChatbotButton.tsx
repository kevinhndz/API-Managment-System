import { Bot } from 'lucide-react'

// Muestra el acceso al agente academico.
export function ChatbotButton({ onClick }: { onClick: () => void }) {
  return <button className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#5b0309] text-white shadow-xl" type="button" onClick={onClick} aria-label="Abrir asistente academico"><Bot className="h-6 w-6" /></button>
}
