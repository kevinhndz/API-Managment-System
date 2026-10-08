import { useEffect, useRef, type ReactNode } from 'react'
import { GraduationCap, Mail, RotateCw, ShieldCheck, X } from 'lucide-react'

import { LanyardBadge } from '../ui/LanyardBadge'

export interface PersonCarnetData {
  name: string
  code: string
  codeLabel: string
  email: string
  phone?: string | null
  status: 'Activo' | 'Inactivo'
  typeLabel: string
  areaLabel: string
  area: string
}

interface PersonCarnetDialogProps {
  person: PersonCarnetData
  onClose: () => void
}

function CarnetSide({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fff8f2] p-5 text-[#36231e] dark:bg-[#191625] dark:text-violet-50">
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full border-[18px] border-[#5b0309]/[0.06] dark:border-violet-300/[0.08]" aria-hidden="true" />
      {children}
    </div>
  )
}

export function PersonCarnetDialog({ person, onClose }: PersonCarnetDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  const front = (
    <CarnetSide>
      <div className="relative flex items-center gap-2 border-b border-[#5b0309]/15 pb-3 dark:border-violet-300/15">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#5b0309] text-white dark:bg-[#5e35b1]"><GraduationCap className="h-5 w-5" /></span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b0309] dark:text-violet-200">CampusFlow</p>
          <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-[#8a716f]">{person.typeLabel}</p>
        </div>
      </div>
      <div className="relative mt-auto pb-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a716f]">Nombre</p>
        <h3 className="mt-1 break-words text-[21px] font-bold leading-tight tracking-tight">{person.name}</h3>
        <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a716f]">{person.codeLabel}</p>
        <p className="mt-1 font-mono text-[15px] font-bold tracking-[0.08em] text-[#5b0309] dark:text-violet-200">{person.code}</p>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-[#5b0309]/15 pt-3 dark:border-violet-300/15">
        <span className="max-w-[145px] truncate text-[9px] font-semibold text-[#705b55]">{person.area}</span>
        <span className={`rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wide ${person.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{person.status}</span>
      </div>
      <span className="absolute bottom-0 left-0 right-0 h-2 bg-[#5b0309] dark:bg-[#5e35b1]" aria-hidden="true" />
    </CarnetSide>
  )

  const back = (
    <CarnetSide>
      <div className="relative flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b0309] dark:text-violet-200">CampusFlow</span>
        <ShieldCheck className="h-5 w-5 text-[#5b0309] dark:text-violet-200" />
      </div>
      <div className="relative mt-5 rounded-xl border border-[#5b0309]/15 bg-white/70 p-3 dark:border-violet-300/15 dark:bg-white/5">
        <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#8a716f]">{person.areaLabel}</p>
        <p className="mt-2 text-[11px] font-semibold leading-snug">{person.area}</p>
      </div>
      <div className="relative mt-3 space-y-2 rounded-xl bg-[#5b0309] p-3 text-white dark:bg-[#4c2b8f]">
        <p className="flex items-center gap-2 break-all text-[9px]"><Mail className="h-3.5 w-3.5 shrink-0" />{person.email}</p>
        {person.phone && <p className="text-[9px]">Teléfono: {person.phone}</p>}
      </div>
      <div className="relative mt-auto border-t border-[#5b0309]/15 pt-3 dark:border-violet-300/15">
        <p className="text-[8px] leading-relaxed text-[#705b55]">Este carnet identifica a la persona dentro de la institución. Si se encuentra, favor devolverlo a la oficina académica.</p>
        <p className="mt-2 font-mono text-[10px] font-bold tracking-[0.12em] text-[#5b0309] dark:text-violet-200">{person.code}</p>
      </div>
    </CarnetSide>
  )

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-carnet-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <section className="my-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-white/50 bg-[#fffaf6]/95 shadow-[0_28px_90px_-30px_rgba(20,4,7,0.7)] backdrop-blur-xl dark:border-[#39334b] dark:bg-[#242033]/95">
        <header className="flex items-center justify-between gap-4 border-b border-[#5b0309]/10 px-5 py-4 dark:border-[#39334b] sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a716f]">Identificación digital</p>
            <h2 id="person-carnet-title" className="mt-1 text-lg font-semibold tracking-tight text-[#36231e] dark:text-stone-100">Carnet de {person.name}</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Cerrar carnet" className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#5b0309]/15 text-[#5b0309] transition-colors hover:bg-[#5b0309]/[0.06] dark:border-[#39334b] dark:text-stone-200 dark:hover:bg-[#302a43]">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="relative px-2 sm:px-6">
          <LanyardBadge front={front} back={back} cardWidth={220} height={Math.max(390, Math.min(590, window.innerHeight - 155))} />
        </div>
        <footer className="flex items-center justify-center gap-2 border-t border-[#5b0309]/10 px-5 py-3 text-xs text-[#705b55] dark:border-[#39334b] dark:text-stone-300">
          <RotateCw className="h-3.5 w-3.5" /> Haz clic en el carnet para ver el reverso
        </footer>
      </section>
    </div>
  )
}
