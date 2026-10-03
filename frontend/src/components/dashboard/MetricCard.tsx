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
    <article className="glass-card surface-lift rounded-[1.25rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {loading ? <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-[#e9e8e5] dark:bg-stone-800" /> : <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#5b0309] dark:text-rose-200">{value.toLocaleString('es-HN')}</p>}
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-xs text-[#8a716f]">{helper}</p>
    </article>
  )
}
