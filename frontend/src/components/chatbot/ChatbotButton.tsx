import { Bot } from 'lucide-react'

export function ChatbotButton({ onClick }: { onClick: () => void }) {
  return <button className="focus-ring fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#5b0309] text-white shadow-xl transition hover:scale-105" type="button" onClick={onClick} aria-label="Abrir asistente academico"><Bot className="h-6 w-6" /></button>
}
