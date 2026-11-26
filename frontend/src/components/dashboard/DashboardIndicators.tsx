import { ChartNoAxesCombined, PanelsTopLeft, SquareCheck, UsersRound } from 'lucide-react'
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

export function DashboardIndicators(props: DashboardIndicatorsProps) {
  const capacity = props.openSectionCapacity ?? 0
  const occupancy = capacity ? ((props.occupiedOpenSeats ?? 0) / capacity * 100).toFixed(1) : null
  const metrics = [
    { label: 'Estudiantes activos', value: props.activeStudents.toLocaleString('es-HN'), detail: `De ${props.totalStudents.toLocaleString('es-HN')} registrados`, icon: UsersRound },
    { label: 'Matrículas vigentes', value: (props.activeEnrollments ?? props.enrollmentCounts?.[0]?.value ?? 0).toLocaleString('es-HN'), detail: props.periodLabel ?? 'Período actual', icon: SquareCheck },
    { label: 'Promedio académico', value: props.averageGrade === null ? '—' : props.averageGrade.toFixed(1), suffix: '/100', detail: `${props.gradedCount.toLocaleString('es-HN')} notas`, icon: ChartNoAxesCombined },
    { label: 'Ocupación de secciones', value: occupancy === null ? '—' : `${occupancy}%`, detail: `${(props.occupiedOpenSeats ?? 0).toLocaleString('es-HN')} de ${capacity.toLocaleString('es-HN')} cupos`, icon: PanelsTopLeft, accent: true },
  ]
  return <section className="academic-metrics" aria-label="Indicadores académicos">
    {metrics.map((metric) => <article key={metric.label}>
      <metric.icon className="academic-metric-icon" size={17} strokeWidth={1.8} aria-hidden="true" />
      <h2>{metric.label}</h2>
      <p className={`academic-metric-value${metric.accent ? ' academic-metric-value--accent' : ''}`}>{metric.value}{metric.suffix && <span>{metric.suffix}</span>}</p>
      <p className="academic-metric-detail">{metric.detail}</p>
    </article>)}
  </section>
}
