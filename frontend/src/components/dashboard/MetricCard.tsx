import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number
  helper: string
  icon: LucideIcon
  tone: 'navy' | 'sage' | 'amber' | 'violet'
  loading?: boolean
}

const tones = {
  navy: 'bg-navy-50 text-navy-700 dark:bg-navy-900 dark:text-blue-200',
  sage: 'bg-sage-50 text-sage-600 dark:bg-sage-950 dark:text-sage-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
}

export function MetricCard({ label, value, helper, icon: Icon, tone, loading }: MetricCardProps) {
  return (
    <article className="surface-lift rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-[#151d1e]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {loading ? <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" /> : <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy-950 dark:text-white">{value.toLocaleString('es-HN')}</p>}
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-xs text-slate-400">{helper}</p>
    </article>
  )
}
