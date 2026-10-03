import { BookOpenCheck, Building2, GraduationCap, RefreshCw, UsersRound } from 'lucide-react'

import { ClassroomCapacityChart } from '../components/dashboard/ClassroomCapacityChart'
import { ClassroomDistributionChart } from '../components/dashboard/ClassroomDistributionChart'
import { MetricCard } from '../components/dashboard/MetricCard'
import { useDashboardData } from '../hooks/useDashboardData'

export function DashboardPage() {
  const { data, loading, error, refresh } = useDashboardData()
  const currentYear = new Date().getFullYear()
  const totalCapacity = data.aulas.reduce((total, aula) => total + aula.capacidad, 0)
  const activeTeachers = data.docentes.filter((docente) => docente.estado).length
  const activePrograms = data.carreras.filter((carrera) => carrera.activo).length

  return (
    <div className="space-y-7">
      <section className="dashboard-reveal relative overflow-hidden rounded-2xl bg-navy-950 px-6 py-8 text-white shadow-panel sm:px-8 sm:py-9">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-sage-500/10" />
        <div className="absolute right-10 top-0 h-full w-px bg-white/10" />
        <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-100">Año académico {currentYear}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Una vista más clara de tu campus.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Aulas, capacidad, equipo docente y oferta académica en un solo lugar.</p>
          </div>
          <button className="focus-ring flex h-11 w-fit items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-navy-950 transition hover:bg-sage-50 active:scale-[0.98]" type="button" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </section>

      {error && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{error}</p>}

      <section className="dashboard-reveal grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Métricas académicas">
        <MetricCard label="Aulas registradas" value={data.aulas.length} helper={`${data.aulas.filter((aula) => aula.activo).length} disponibles`} icon={Building2} tone="navy" loading={loading} />
        <MetricCard label="Capacidad total" value={totalCapacity} helper="Cupos entre todas las aulas" icon={BookOpenCheck} tone="amber" loading={loading} />
        <MetricCard label="Docentes activos" value={activeTeachers} helper={`${data.docentes.length} docentes registrados`} icon={UsersRound} tone="sage" loading={loading} />
        <MetricCard label="Carreras activas" value={activePrograms} helper={`${data.carreras.length} programas registrados`} icon={GraduationCap} tone="violet" loading={loading} />
      </section>

      <section className="dashboard-reveal grid gap-6 xl:grid-cols-[1.4fr_1fr]" aria-label="Gráficos académicos">
        <ClassroomCapacityChart aulas={data.aulas} />
        <ClassroomDistributionChart aulas={data.aulas} />
      </section>
    </div>
  )
}
