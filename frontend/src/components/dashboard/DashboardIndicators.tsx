import { BookOpenCheck, Building2, UsersRound } from 'lucide-react'

import { AnimatedMetricNumber } from './AnimatedMetricNumber'
import './DashboardIndicators.css'

interface DashboardIndicatorsProps {
  activeStudents: number
  totalStudents: number
  sectionCounts?: { label: string; value: number }[]
  enrollmentCounts?: { label: string; value: number }[]
  gradeCounts?: { label: string; value: number }[]
  activeEnrollments?: number
  openSections?: number
  periodLabel?: string
  averageGrade: number | null
  gradedCount: number
  occupiedOpenSeats?: number
  openSectionCapacity?: number
}

function MetricRing({ value, color }: { value: number | null; color: string }) {
  const radius = 17
  const circumference = 2 * Math.PI * radius
  const progress = value === null ? 0 : Math.max(0, Math.min(value, 100))

  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center" aria-hidden="true">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="4" />
        <circle cx="22" cy="22" r={radius} fill="none" stroke={color} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} strokeLinecap="round" strokeWidth="4" />
      </svg>
      <span className="text-[9px] font-extrabold" style={{ color }}>{value === null ? '—' : `${Math.round(value)}%`}</span>
    </span>
  )
}

export function DashboardIndicators(props: DashboardIndicatorsProps) {
  const activeStudents = props.activeStudents
  const totalStudents = props.totalStudents
  const activeEnrollments = props.activeEnrollments ?? props.enrollmentCounts?.[0]?.value ?? 0
  const openSections = props.openSections ?? props.sectionCounts?.[0]?.value ?? 0
  const periodLabel = props.periodLabel ?? 'Ciclo actual'
  const averageGrade = props.averageGrade
  const gradedCount = props.gradedCount
  const occupiedOpenSeats = props.occupiedOpenSeats ?? 0
  const openSectionCapacity = props.openSectionCapacity ?? 0
  const occupancy = openSectionCapacity ? (occupiedOpenSeats / openSectionCapacity) * 100 : null

  return (
    <section className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-12" aria-label="Indicadores académicos">
      <article className="berry-primary-metric relative flex min-h-[178px] flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-[0_12px_28px_-16px_rgba(69,39,160,.65)] xl:col-span-4">
        <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -right-16 top-12 h-48 w-48 rounded-full border border-white/10" />
        <div className="relative z-10 flex items-center justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-black/15"><UsersRound size={21} /></span>
          <span className="rounded-lg bg-black/15 px-2.5 py-1 text-[10px] font-semibold">Estudiantes</span>
        </div>
        <div className="relative z-10 my-3">
          <AnimatedMetricNumber value={activeStudents} className="text-3xl font-extrabold tracking-tight" />
          <h2 className="mt-1 text-xs font-semibold text-violet-100">Estudiantes activos</h2>
        </div>
        <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/15 pt-2.5 text-[10px] text-violet-100">
          <span>{activeStudents.toLocaleString('es')} de {totalStudents.toLocaleString('es')} registrados</span>
          <span className="font-semibold">Estado actual</span>
        </div>
      </article>

      <article className="berry-secondary-metric relative flex min-h-[178px] flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-[0_12px_28px_-16px_rgba(21,101,192,.55)] xl:col-span-4">
        <span className="pointer-events-none absolute -bottom-14 -right-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-black/15"><BookOpenCheck size={20} /></span>
          <span className="rounded-lg bg-black/15 px-2.5 py-1 text-[10px] font-semibold">{periodLabel}</span>
        </div>
        <div className="relative z-10 my-3 flex items-center justify-between gap-3">
          <div>
            <AnimatedMetricNumber value={activeEnrollments} className="text-3xl font-extrabold tracking-tight" />
            <h2 className="mt-1 text-xs font-semibold text-blue-100">Matrículas vigentes</h2>
          </div>
          <svg className="h-10 w-24 shrink-0 text-white/85" viewBox="0 0 100 40" fill="none" aria-hidden="true">
            <path d="M2 31C14 31 11 13 24 14C35 15 34 30 45 28C57 25 54 8 66 8C77 8 75 24 84 23C91 22 93 14 98 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/15 pt-2.5 text-[10px] text-blue-100">
          <span>{openSections.toLocaleString('es')} secciones abiertas</span>
          <span className="font-semibold">Datos del sistema</span>
        </div>
      </article>

      <div className="flex flex-col justify-between gap-4 md:col-span-2 xl:col-span-4">
        <article className="berry-mini-metric flex min-h-[82px] items-center justify-between gap-3 rounded-2xl border border-[#e3e8ef] bg-white p-4 shadow-[0_2px_14px_rgba(32,40,45,.06)] transition-colors hover:border-[#5e35b1]/30 dark:border-white/10 dark:bg-[#211e2b]">
          <div className="flex min-w-0 items-center gap-3">
            <MetricRing value={averageGrade} color="#5e35b1" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight text-[#121926] dark:text-white">{averageGrade === null ? '—' : averageGrade.toFixed(1)} <span className="text-[10px] font-medium text-[#697586]">/ 100 pts</span></p>
              <p className="mt-1 text-[10px] font-medium text-[#697586] dark:text-stone-300">Promedio académico global</p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-[#ede7f6] px-2 py-1 text-[9px] font-bold text-[#5e35b1] dark:bg-[#5e35b1]/20 dark:text-violet-200">{gradedCount} notas</span>
        </article>

        <article className="berry-mini-metric flex min-h-[82px] items-center justify-between gap-3 rounded-2xl border border-[#e3e8ef] bg-white p-4 shadow-[0_2px_14px_rgba(32,40,45,.06)] transition-colors hover:border-[#2196f3]/30 dark:border-white/10 dark:bg-[#211e2b]">
          <div className="flex min-w-0 items-center gap-3">
            <MetricRing value={occupancy} color="#2196f3" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight text-[#121926] dark:text-white">{occupancy === null ? '—' : `${occupancy.toFixed(1)}%`} <span className="text-[10px] font-medium text-[#697586]">cupos</span></p>
              <p className="mt-1 text-[10px] font-medium text-[#697586] dark:text-stone-300">Ocupación de secciones abiertas</p>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-[#e3f2fd] px-2 py-1 text-[9px] font-bold text-[#1565c0] dark:bg-blue-950/50 dark:text-blue-200"><Building2 size={11} />{occupiedOpenSeats}/{openSectionCapacity}</span>
        </article>
      </div>
    </section>
  )
}
