import type { ReactNode } from 'react'
import { BookOpen, GraduationCap, UsersRound } from 'lucide-react'

import { AnimatedMetricNumber } from './AnimatedMetricNumber'
import './DashboardIndicators.css'

interface Segment { label: string; value: number }

interface ChartIndicatorProps {
  title: string
  value: number | null
  suffix?: string
  description: string
  icon: ReactNode
  segments: Segment[]
  tone: 'green' | 'amber' | 'blue'
}

function ChartIndicator({ title, value, suffix, description, icon, segments, tone }: ChartIndicatorProps) {
  const max = Math.max(1, ...segments.map((segment) => segment.value))

  return (
    <article className={`dashboard-indicator chart-indicator chart-indicator--${tone}`}>
      <div className="indicator-heading"><span className="indicator-icon" aria-hidden="true">{icon}</span><span className="indicator-eyebrow">Indicador academico</span></div>
      <h3>{title}</h3>
      <p className="indicator-value">{value === null ? '—' : <AnimatedMetricNumber value={value} decimals={tone === 'blue' ? 1 : 0} suffix={suffix} />}</p>
      <p className="indicator-description">{description}</p>
      <div className="indicator-chart" role="img" aria-label={`${title}: ${segments.map(({ label, value: count }) => `${label} ${count}`).join(', ')}`}>
        {segments.map((segment) => (
          <div className="indicator-bar-group" key={segment.label} tabIndex={0} aria-label={`${segment.label}: ${segment.value}`}>
            <span className="indicator-tooltip">{segment.label}: {segment.value}</span>
            <span className="indicator-bar-track"><span className="indicator-bar" style={{ height: `${segment.value ? Math.max(14, segment.value / max * 100) : 3}%` }} /></span>
            <span className="indicator-bar-label">{segment.label}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

interface DashboardIndicatorsProps {
  activeStudents: number
  totalStudents: number
  sectionCounts: Segment[]
  enrollmentCounts: Segment[]
  gradeCounts: Segment[]
  averageGrade: number | null
  gradedCount: number
}

export function DashboardIndicators({ activeStudents, totalStudents, sectionCounts, enrollmentCounts, gradeCounts, averageGrade, gradedCount }: DashboardIndicatorsProps) {
  return (
    <section className="dashboard-reveal grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores académicos">
      <article className="dashboard-indicator student-indicator">
        <div className="indicator-heading"><span className="indicator-icon" aria-hidden="true"><UsersRound size={20} /></span><span className="indicator-eyebrow">Comunidad estudiantil</span></div>
        <div className="student-indicator-content"><h3>Estudiantes activos</h3><AnimatedMetricNumber value={activeStudents} className="student-indicator-value" /><p>Personas con estado activo en el campus</p></div>
        <div className="student-indicator-footer"><span className="student-indicator-dot" />{totalStudents ? `${activeStudents} de ${totalStudents} estudiantes registrados` : 'Sin estudiantes registrados'}</div>
      </article>
      <ChartIndicator title="Secciones abiertas" value={sectionCounts[0].value} description="Clases disponibles para el periodo" icon={<BookOpen size={20} />} segments={sectionCounts} tone="green" />
      <ChartIndicator title="Matrículas activas" value={enrollmentCounts[0].value} description="Inscripciones vigentes actualmente" icon={<GraduationCap size={20} />} segments={enrollmentCounts} tone="amber" />
      <ChartIndicator title="Promedio registrado" value={averageGrade} suffix={averageGrade === null ? '' : '/100'} description={`${gradedCount} calificaciones con nota final disponible`} icon={<span className="indicator-grade-icon" aria-hidden="true">∑</span>} segments={gradeCounts} tone="blue" />
    </section>
  )
}
