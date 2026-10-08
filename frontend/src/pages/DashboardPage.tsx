import { ArrowUpRight, RefreshCw } from 'lucide-react'

import { ClassroomCapacityChart } from '../components/dashboard/ClassroomCapacityChart'
import { ClassroomDistributionChart } from '../components/dashboard/ClassroomDistributionChart'
import { CircularCarousel } from '../components/dashboard/CircularCarousel'
import { DashboardIndicators } from '../components/dashboard/DashboardIndicators'
import { EnrollmentTrendChart } from '../components/dashboard/EnrollmentTrendChart'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../contexts/AuthContext'
import { useDashboardData } from '../hooks/useDashboardData'
import './DashboardPage.css'

const classroomImage = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85'
const teachingImage = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=85'
const metricImages = {
  classrooms: classroomImage,
  capacity: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=85',
  teachers: teachingImage,
  programs: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=85',
  students: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85',
  subjects: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=85',
  periods: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=85',
  sections: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=85',
  enrollments: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=85',
  grades: 'https://images.unsplash.com/photo-1453738773917-9c3eff1db985?auto=format&fit=crop&w=1200&q=85',
}

export function DashboardPage() {
  const { data, loading, refreshing, error, refresh } = useDashboardData()
  const { user } = useAuth()
  const activePeriod = data.periodo
  const currentYear = data.anio
  const periodNumber = activePeriod?.numero
  const periodLabel = activePeriod
    ? `Ciclo ${activePeriod.anio}-${periodNumber === 1 ? 'I' : periodNumber === 2 ? 'II' : periodNumber}`
    : `Ciclo ${currentYear}`
  const totalCapacity = data.aulas.capacidad_total
  const activeTeachers = data.docentes.activos
  const activePrograms = data.carreras.activas
  const activeStudents = data.estudiantes.activos
  const activeSections = data.secciones.abiertas
  const activeEnrollments = data.matriculas.activas
  const occupiedOpenSeats = data.cupos_ocupados
  const openSectionCapacity = data.capacidad_secciones_abiertas
  const gradedCount = data.calificaciones.cantidad
  const averageGrade = data.calificaciones.promedio
  const sectionStatuses = [
    { label: 'Abiertas', status: 'ABIERTA', color: '#5e35b1' },
    { label: 'Cerradas', status: 'CERRADA', color: '#2196f3' },
    { label: 'Canceladas', status: 'CANCELADA', color: '#d1c4e9' },
  ]

  return (
    <main className="berry-dashboard -mx-4 -my-6 min-h-[calc(100vh-76px)] px-4 pb-10 pt-6 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {loading && <section className="berry-surface rounded-2xl p-5" aria-label="Cargando indicadores"><div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-28" /></div><Skeleton className="mt-5 h-3 w-full" /></section>}

        {error && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-[#697586] dark:text-stone-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> {periodLabel} <span className="hidden sm:inline">· CampusFlow</span>
          </div>
          <button className="berry-refresh-button inline-flex items-center gap-1.5 rounded-lg border border-[#e3e8ef] bg-white px-3 py-2 text-[10px] font-semibold text-[#5e35b1] shadow-sm transition-colors hover:bg-[#ede7f6] disabled:opacity-50 dark:border-white/10 dark:bg-[#211e2b] dark:text-violet-200 dark:hover:bg-white/10" type="button" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        <DashboardIndicators
          activeStudents={activeStudents}
          totalStudents={data.estudiantes.total}
          activeEnrollments={activeEnrollments}
          openSections={activeSections}
          periodLabel={periodLabel}
          averageGrade={averageGrade}
          gradedCount={gradedCount}
          occupiedOpenSeats={occupiedOpenSeats}
          openSectionCapacity={openSectionCapacity}
        />

        <section className="grid items-stretch gap-4 xl:grid-cols-12" aria-label="Actividad y espacios del campus">
          <div className="xl:col-span-8">
            <EnrollmentTrendChart trend={data.matriculas.tendencia} year={currentYear} periodLabel={periodLabel} />
          </div>
          <div className="xl:col-span-4">
            <ClassroomDistributionChart buildings={data.edificios} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-12" aria-label="Resumen de módulos académicos">
          <article className="berry-surface overflow-hidden rounded-2xl border border-[#e3e8ef] bg-white shadow-[0_2px_14px_rgba(32,40,45,.06)] xl:col-span-7 dark:border-white/10 dark:bg-[#211e2b]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f4] px-5 py-4 dark:border-white/10">
              <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#697586] dark:text-stone-400">Recorrido del campus</p><h2 className="mt-1 text-sm font-bold text-[#121926] dark:text-white">Tus módulos académicos</h2></div>
              <span className="rounded-md bg-[#ede7f6] px-2 py-1 text-[9px] font-bold text-[#5e35b1] dark:bg-[#5e35b1]/20 dark:text-violet-200">{data.asignaturas_total} asignaturas</span>
            </div>
            <CircularCarousel items={[
              { src: metricImages.classrooms, alt: 'Aulas universitarias', title: 'Aulas', subtitle: `${data.aulas.total} registradas` },
              { src: metricImages.capacity, alt: 'Espacio académico', title: 'Capacidad', subtitle: `${totalCapacity} cupos` },
              { src: metricImages.teachers, alt: 'Docente en clase', title: 'Docentes', subtitle: `${activeTeachers} activos` },
              { src: metricImages.programs, alt: 'Edificio universitario', title: 'Carreras', subtitle: `${activePrograms} activas` },
              { src: metricImages.students, alt: 'Estudiantes universitarios', title: 'Estudiantes', subtitle: `${activeStudents} activos` },
              { src: metricImages.subjects, alt: 'Libros y asignaturas', title: 'Asignaturas', subtitle: `${data.asignaturas_total} registradas` },
              { src: metricImages.periods, alt: 'Calendario académico', title: 'Períodos', subtitle: `${data.periodos_total} registrados` },
              { src: metricImages.sections, alt: 'Clase universitaria', title: 'Secciones', subtitle: `${data.secciones.total} registradas` },
              { src: metricImages.enrollments, alt: 'Registro académico', title: 'Matrículas', subtitle: `${activeEnrollments} activas` },
              { src: metricImages.grades, alt: 'Calificaciones académicas', title: 'Calificaciones', subtitle: `${gradedCount} evaluadas` },
            ]} />
          </article>

          <div className="grid gap-4 sm:grid-cols-2 xl:col-span-5 xl:grid-cols-1">
            <ClassroomCapacityChart aulas={data.aulas_mayor_capacidad} />
            <article className="berry-surface rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-[0_2px_14px_rgba(32,40,45,.06)] dark:border-white/10 dark:bg-[#211e2b]">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#697586] dark:text-stone-400">Vista rápida</p><h2 className="mt-1 text-sm font-bold text-[#121926] dark:text-white">Estado de las secciones</h2></div><span className="rounded-lg bg-[#ede7f6] p-2 text-[#5e35b1] dark:bg-[#5e35b1]/20 dark:text-violet-200"><ArrowUpRight size={15} /></span></div>
              <div className="mt-4 space-y-3">
                {sectionStatuses.map(({ label, status, color }) => {
                  const count = status === 'ABIERTA' ? data.secciones.abiertas : status === 'CERRADA' ? data.secciones.cerradas : data.secciones.canceladas
                  const percentage = data.secciones.total ? (count / data.secciones.total) * 100 : 0
                  return <div key={status}><div className="mb-1 flex items-center justify-between text-[10px]"><span className="font-medium text-[#697586] dark:text-stone-300">{label}</span><strong className="text-[#121926] dark:text-white">{count}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-[#eef2f6] dark:bg-white/10"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} /></div></div>
                })}
                {!data.secciones.total && <p className="py-3 text-center text-[10px] text-[#697586] dark:text-stone-400">No hay secciones registradas.</p>}
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[.7fr_1.3fr]" aria-label="Indicadores complementarios">
          <article className="berry-note-card relative overflow-hidden rounded-2xl p-5 text-white">
            <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border border-white/15" />
            <div className="relative"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-violet-200">CampusFlow · {currentYear}</p><h2 className="mt-3 text-xl font-bold tracking-tight">Actividad en contexto</h2><p className="mt-2 max-w-sm text-[11px] leading-5 text-violet-100/85">Consulta la ocupación y las matrículas para preparar el siguiente ciclo académico.</p><div className="mt-5 flex items-center gap-2 text-[10px] font-semibold text-violet-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> {user?.name ? `Sesión de ${user.name}` : 'Sistema académico'}</div></div>
          </article>
          <article className="berry-surface rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-[0_2px_14px_rgba(32,40,45,.06)] dark:border-white/10 dark:bg-[#211e2b]">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#697586] dark:text-stone-400">Resumen de infraestructura</p><h2 className="mt-1 text-sm font-bold text-[#121926] dark:text-white">Capacidad registrada</h2></div><span className="rounded-md bg-[#e3f2fd] px-2 py-1 text-[9px] font-bold text-[#1565c0] dark:bg-blue-950/50 dark:text-blue-200">Campus UPH</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#f8fafc] p-3 dark:bg-white/5"><p className="text-[9px] text-[#697586] dark:text-stone-400">Aulas activas</p><p className="mt-1 text-xl font-extrabold text-[#5e35b1] dark:text-violet-200">{data.aulas.activas}</p></div>
              <div className="rounded-xl bg-[#f8fafc] p-3 dark:bg-white/5"><p className="text-[9px] text-[#697586] dark:text-stone-400">Cupos de aula</p><p className="mt-1 text-xl font-extrabold text-[#2196f3]">{totalCapacity}</p></div>
              <div className="rounded-xl bg-[#f8fafc] p-3 dark:bg-white/5"><p className="text-[9px] text-[#697586] dark:text-stone-400">Docentes activos</p><p className="mt-1 text-xl font-extrabold text-[#5e35b1] dark:text-violet-200">{activeTeachers}</p></div>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
