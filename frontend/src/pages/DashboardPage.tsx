import { RefreshCw } from 'lucide-react'
import { ClassroomCapacityChart } from '../components/dashboard/ClassroomCapacityChart'
import { ClassroomDistributionChart } from '../components/dashboard/ClassroomDistributionChart'
import { DashboardIndicators } from '../components/dashboard/DashboardIndicators'
import { EnrollmentTrendChart } from '../components/dashboard/EnrollmentTrendChart'
import { Skeleton } from '../components/ui/Skeleton'
import { useDashboardData } from '../hooks/useDashboardData'
import './DashboardPage.css'

export function DashboardPage() {
  const { data, loading, refreshing, error, refresh } = useDashboardData()
  const periodLabel = data.periodo ? `Período ${data.periodo.anio}-${data.periodo.numero}` : `Año lectivo ${data.anio}`
  return <div className="academic-dashboard">
    <header className="academic-page-header">
      <div><h1>Resumen académico</h1><p>Métricas operativas del campus y del registro curricular</p></div>
      <div className="academic-header-actions"><span className="academic-period"><i />{periodLabel}</span><button type="button" className="academic-button" onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />Actualizar</button></div>
    </header>
    {error && <p role="alert" className="academic-error">{error}</p>}
    {loading ? <section aria-label="Cargando indicadores" className="py-8"><Skeleton className="h-24 w-full" /><Skeleton className="mt-8 h-72 w-full" /></section> : <>
      <DashboardIndicators activeStudents={data.estudiantes.activos} totalStudents={data.estudiantes.total} activeEnrollments={data.matriculas.activas} openSections={data.secciones.abiertas} periodLabel={periodLabel} averageGrade={data.calificaciones.promedio} gradedCount={data.calificaciones.cantidad} occupiedOpenSeats={data.cupos_ocupados} openSectionCapacity={data.capacidad_secciones_abiertas} />
      <section className="academic-chart-row" aria-label="Matrículas y secciones">
        <EnrollmentTrendChart trend={data.matriculas.tendencia} year={data.anio} periodLabel={periodLabel} />
        <article className="academic-section-status">
          <h2>Estado de las secciones</h2><p>{data.secciones.total.toLocaleString('es-HN')} secciones registradas</p>
          <div className="academic-section-bars">{[
            { label: 'Secciones abiertas', value: data.secciones.abiertas, color: '#5b32d6' },
            { label: 'Secciones cerradas', value: data.secciones.cerradas, color: '#797486' },
            ...(data.secciones.canceladas ? [{ label: 'Secciones canceladas', value: data.secciones.canceladas, color: '#d97706' }] : []),
            ...(data.secciones.otros_estados ? [{ label: 'Otros estados', value: data.secciones.otros_estados, color: '#94a3b8' }] : []),
          ].map((item) => {
            const percent = data.secciones.total ? item.value / data.secciones.total * 100 : 0
            return <div className="academic-section-bar" key={item.label}>
              <div><span><i style={{ backgroundColor: item.color }} />{item.label}</span><strong>{item.value.toLocaleString('es-HN')} <small>({percent.toFixed(1)}%)</small></strong></div>
              <meter min={0} max={Math.max(data.secciones.total, 1)} value={item.value} aria-label={item.label} style={{ accentColor: item.color, color: item.color }} />
            </div>
          })}</div>
          {!data.secciones.total && <p className="academic-empty">No hay secciones registradas.</p>}
        </article>
      </section>
      <section className="academic-infrastructure" aria-label="Infraestructura académica">
        <ClassroomDistributionChart buildings={data.edificios} />
        <ClassroomCapacityChart aulas={data.aulas_mayor_capacidad} />
      </section>
    </>}
  </div>
}
