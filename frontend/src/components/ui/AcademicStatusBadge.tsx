import { Ban, CircleCheck, CircleX, Clock3, HelpCircle } from 'lucide-react'

interface AcademicStatusBadgeProps {
  status: string
}

const statusStyles: Record<string, { label: string; className: string; icon: typeof CircleCheck }> = {
  activa: { label: 'Activa', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', icon: CircleCheck },
  aprobada: { label: 'Aprobada', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', icon: CircleCheck },
  abierta: { label: 'Abierta', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', icon: CircleCheck },
  pendiente: { label: 'Pendiente', className: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300', icon: Clock3 },
  cerrada: { label: 'Cerrada', className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', icon: CircleX },
  cancelada: { label: 'Cancelada', className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', icon: CircleX },
  reprobada: { label: 'Reprobada', className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', icon: CircleX },
  rechazada: { label: 'Rechazada', className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', icon: CircleX },
  inactiva: { label: 'Inactiva', className: 'border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300', icon: Ban },
  inactivo: { label: 'Inactivo', className: 'border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300', icon: Ban },
}

function normalizeStatus(status: string) {
  return status.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function AcademicStatusBadge({ status }: AcademicStatusBadgeProps) {
  const normalized = normalizeStatus(status)
  const known = statusStyles[normalized]
  const label = known?.label ?? status.trim().toLocaleLowerCase('es').replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase('es'))
  const Icon = known?.icon ?? HelpCircle

  return <span role="status" aria-label={`Estado: ${label}`} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${known?.className ?? 'border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'}`}>
    <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
    {label}
  </span>
}
