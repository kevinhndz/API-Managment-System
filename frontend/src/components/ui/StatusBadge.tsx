import { Ban, CircleCheck } from 'lucide-react'

interface StatusBadgeProps {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}

export function StatusBadge({ active, activeLabel = 'Activo', inactiveLabel = 'Inactivo' }: StatusBadgeProps) {
  const label = active ? activeLabel : inactiveLabel

  return (
    <span
      role="status"
      aria-label={`Estado: ${label}`}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-700 text-white dark:bg-emerald-600'
          : 'border border-slate-400 bg-transparent text-slate-600 dark:border-slate-500 dark:text-slate-300'
      }`}
    >
      {active
        ? <CircleCheck aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
        : <Ban aria-hidden="true" className="h-4 w-4" strokeWidth={2} />}
      {label}
    </span>
  )
}
