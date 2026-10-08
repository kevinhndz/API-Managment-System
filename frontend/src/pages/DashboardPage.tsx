import { ArrowUpRight, RefreshCw } from 'lucide-react'

import { ClassroomCapacityChart } from '../components/dashboard/ClassroomCapacityChart'
import { ClassroomDistributionChart } from '../components/dashboard/ClassroomDistributionChart'
import { useAuth } from '../contexts/AuthContext'
import { useDashboardData } from '../hooks/useDashboardData'
import { CircularCarousel } from '../components/dashboard/CircularCarousel'
import { DashboardIndicators } from '../components/dashboard/DashboardIndicators'
import { Skeleton } from '../components/ui/Skeleton'

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
  const { data, loading, error, refresh } = useDashboardData()
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()
  const totalCapacity = data.aulas.reduce((total, aula) => total + aula.capacidad, 0)
  const activeTeachers = data.docentes.filter((docente) => docente.estado).length
  const activePrograms = data.carreras.filter((carrera) => carrera.activo).length
  const activeStudents = data.estudiantes.filter((student) => student.estado).length
  const activeEnrollments = data.matriculas.filter((enrollment) => enrollment.estado.toLocaleLowerCase('es') === 'activa').length
  const graded = data.calificaciones.filter((grade) => grade.nota_final !== null && grade.nota_final !== undefined && String(grade.nota_final).trim() !== '').map((grade) => Number(grade.nota_final)).filter((grade) => Number.isFinite(grade) && grade >= 0 && grade <= 100)
  const averageGrade = graded.length ? graded.reduce((total, grade) => total + grade, 0) / graded.length : null
  const sectionCounts = ['Abiertas', 'Cerradas', 'Canceladas'].map((label) => ({ label, value: data.secciones.filter((section) => section.estado.toLocaleLowerCase('es') === label.slice(0, -1).toLocaleLowerCase('es')).length }))
  const enrollmentCounts = ['Activas', 'Canceladas'].map((label) => ({ label, value: data.matriculas.filter((enrollment) => enrollment.estado.toLocaleLowerCase('es') === label.slice(0, -1).toLocaleLowerCase('es')).length }))
  const gradeCounts = [
    { label: '0–59', value: graded.filter((grade) => grade < 60).length },
    { label: '60–79', value: graded.filter((grade) => grade >= 60 && grade < 80).length },
    { label: '80–100', value: graded.filter((grade) => grade >= 80).length },
  ]
  const greeting = user?.name ? `Buenos días, ${user.name.split(' ')[0]}` : 'Buenos días'

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      {loading && <section className="dashboard-reveal glass-card rounded-[1.5rem] p-6 sm:p-8" aria-label="Carga del dashboard"><div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-28" /></div><Skeleton className="mt-5 h-3 w-full" /><Skeleton className="mt-3 h-3 w-4/5" /></section>}
      <section className="dashboard-reveal grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="relative min-h-[285px] overflow-hidden rounded-[1.5rem] bg-[#5b0309] p-7 text-white shadow-[0_24px_70px_-35px_rgb(91_3_9_/_0.75)] sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgb(255_223_152_/_0.22),transparent_24rem)]" />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffdf98]">CampusFlow · {currentYear}</p>
              <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.06em] sm:text-5xl">{greeting}</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-rose-100/80">Aquí tienes una lectura clara de la actividad académica y de los espacios disponibles en el campus.</p>
            </div>
            <button className="focus-ring pressable flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#5b0309]" type="button" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar datos
            </button>
          </div>
        </div>

        <div className="glass-card relative min-h-[285px] overflow-hidden rounded-[1.5rem] p-6">
          <img className="absolute inset-0 h-full w-full object-cover opacity-80" src={teachingImage} alt="Docente impartiendo una clase" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c1a]/90 via-[#1a1c1a]/20 to-transparent" />
          <div className="relative flex h-full flex-col justify-end text-white">
            <span className="mb-3 w-fit rounded-md bg-[#ffdf98] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b0309]">En el campus</span>
            <h3 className="text-2xl font-semibold tracking-[-0.04em]">Aulas listas para enseñar</h3>
            <p className="mt-2 max-w-sm text-sm text-white/75">Revisa capacidad, disponibilidad y distribución de tus espacios.</p>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#ffdf98]">Ver aulas <ArrowUpRight className="h-4 w-4" /></div>
          </div>
        </div>
      </section>

      {error && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}

      <section className="dashboard-reveal glass-card overflow-hidden rounded-[1.5rem]" aria-label="Tarjetas de métricas">
        <CircularCarousel items={[
          { src: metricImages.classrooms, alt: 'Aulas universitarias', title: 'Aulas', subtitle: `${data.aulas.length} registradas` },
          { src: metricImages.capacity, alt: 'Espacio académico', title: 'Capacidad', subtitle: `${totalCapacity} cupos` },
          { src: metricImages.teachers, alt: 'Docente en clase', title: 'Docentes', subtitle: `${activeTeachers} activos` },
          { src: metricImages.programs, alt: 'Edificio universitario', title: 'Carreras', subtitle: `${activePrograms} activas` },
          { src: metricImages.students, alt: 'Estudiantes universitarios', title: 'Estudiantes', subtitle: `${activeStudents} activos` },
          { src: metricImages.subjects, alt: 'Libros y asignaturas', title: 'Asignaturas', subtitle: `${data.asignaturas.length} registradas` },
          { src: metricImages.periods, alt: 'Calendario académico', title: 'Períodos', subtitle: `${data.periodos.length} registrados` },
          { src: metricImages.sections, alt: 'Clase universitaria', title: 'Secciones', subtitle: `${data.secciones.length} registradas` },
          { src: metricImages.enrollments, alt: 'Registro académico', title: 'Matrículas', subtitle: `${activeEnrollments} activas` },
          { src: metricImages.grades, alt: 'Calificaciones académicas', title: 'Calificaciones', subtitle: `${graded.length} evaluadas` },
        ]} />
      </section>

      <DashboardIndicators activeStudents={activeStudents} totalStudents={data.estudiantes.length} sectionCounts={sectionCounts} enrollmentCounts={enrollmentCounts} gradeCounts={gradeCounts} averageGrade={averageGrade} gradedCount={graded.length} />

      <section className="dashboard-reveal grid gap-5 xl:grid-cols-[1.25fr_.75fr]" aria-label="Gráficos académicos">
        <ClassroomCapacityChart aulas={data.aulas} />
        <ClassroomDistributionChart aulas={data.aulas} />
      </section>

      <section className="dashboard-reveal grid gap-5 xl:grid-cols-[.85fr_1.15fr]" aria-label="Actividad académica">
        <article className="glass-card rounded-[1.25rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a716f]">Oferta actual</p><h3 className="mt-2 font-semibold tracking-tight text-[#1a1c1a] dark:text-white">Secciones con mayor ocupación</h3><p className="mt-1 text-xs text-[#8a716f]">Cupos utilizados frente al límite de cada clase</p></div>
            <span className="rounded-lg bg-[#f1eadf] px-2 py-1 text-xs font-bold text-[#5b0309] dark:bg-stone-800 dark:text-rose-200">{data.asignaturas.length} asignaturas</span>
          </div>
          <div className="mt-6 space-y-4">
            {['ABIERTA', 'CERRADA', 'CANCELADA'].map((status, index) => { const count = data.secciones.filter((section) => section.estado.toLocaleUpperCase('es') === status).length; return <div key={status}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-slate-600 dark:text-slate-300">Secciones {status.toLocaleLowerCase('es')}</span><strong className="tabular-nums text-slate-800 dark:text-white">{count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-[#f0e8e7] dark:bg-stone-800"><div className="h-full rounded-full" style={{ width: `${data.secciones.length ? Math.max((count / data.secciones.length) * 100, count ? 8 : 0) : 0}%`, backgroundColor: ['#378b64', '#b7793f', '#8a716f'][index] }} /></div></div> })}
            {!data.secciones.length && <p className="py-10 text-center text-sm text-slate-400">No hay secciones registradas para mostrar.</p>}
          </div>
        </article>
      </section>

      <section className="dashboard-reveal grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
        <div className="glass-card relative min-h-[250px] overflow-hidden rounded-[1.5rem] p-6">
          <img className="absolute inset-0 h-full w-full object-cover opacity-25" src={classroomImage} alt="Estudiantes en un aula universitaria" />
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/85 to-transparent dark:from-stone-900 dark:via-stone-900/85" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a716f]">Lectura rápida</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#1a1c1a] dark:text-white">El campus, en movimiento.</h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#574240] dark:text-stone-300">Usa estas métricas para detectar capacidad disponible y preparar la siguiente jornada.</p>
            <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-[#5b0309] dark:text-rose-200"><span className="h-2 w-2 rounded-full bg-[#5b0309]" /> Datos actualizados este ciclo</div>
          </div>
        </div>
        <div className="glass-card rounded-[1.5rem] p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a716f]">Distribución</p><h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#1a1c1a] dark:text-white">Dónde sucede la actividad</h3></div><span className="rounded-lg bg-[#ffdad7] px-2 py-1 text-xs font-bold text-[#5b0309]">Campus UPH</span></div>
          <div className="mt-7 grid grid-cols-3 gap-3"><div className="rounded-xl bg-[#f4f3f0] p-4 dark:bg-stone-800"><p className="text-xs text-[#8a716f]">Aulas activas</p><p className="mt-2 text-2xl font-semibold text-[#5b0309] dark:text-rose-200">{data.aulas.filter((aula) => aula.activo).length}</p></div><div className="rounded-xl bg-[#f4f3f0] p-4 dark:bg-stone-800"><p className="text-xs text-[#8a716f]">Docentes</p><p className="mt-2 text-2xl font-semibold text-[#5b0309] dark:text-rose-200">{activeTeachers}</p></div><div className="rounded-xl bg-[#f4f3f0] p-4 dark:bg-stone-800"><p className="text-xs text-[#8a716f]">Programas</p><p className="mt-2 text-2xl font-semibold text-[#5b0309] dark:text-rose-200">{activePrograms}</p></div></div>
        </div>
      </section>
    </div>
  )
}
