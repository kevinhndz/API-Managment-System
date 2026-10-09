interface CampusFlowLogoProps {
  compact?: boolean
  light?: boolean
  className?: string
}

export function CampusFlowLogo({ compact = false, light = false, className = '' }: CampusFlowLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <img className="h-10 w-10 shrink-0" src="/campusflow-mark.svg" alt="" aria-hidden="true" />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className={`block whitespace-nowrap text-[17px] font-bold tracking-[-0.04em] ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            Campus<span className="font-medium text-violet-600 dark:text-violet-300">Flow</span>
          </span>
          <span className={`mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.12em] ${light ? 'text-violet-100/70' : 'text-slate-500 dark:text-slate-400'}`}>
            Gestión académica
          </span>
        </span>
      )}
    </span>
  )
}
