import { Building2, MoreHorizontal } from 'lucide-react'

interface ClassroomDistributionChartProps {
  buildings: { nombre: string; aulas_activas: number; aulas_totales: number; ocupacion: number | null; capacidad: number }[]
}

export function ClassroomDistributionChart({ buildings }: ClassroomDistributionChartProps) {
  const totalActiveRooms = buildings.reduce((total, building) => total + building.aulas_activas, 0)
  const featured = buildings[0]

  return (
    <article className="berry-surface flex min-h-[350px] flex-col rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-[0_2px_14px_rgba(32,40,45,.06)] sm:p-6 dark:border-white/10 dark:bg-[#211e2b]">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#121926] dark:text-white">Distribución por edificio</h2>
          <p className="mt-0.5 text-[10px] text-[#697586] dark:text-stone-400">Aulas y ocupación de secciones abiertas</p>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-lg text-[#697586] dark:text-stone-300" aria-hidden="true"><MoreHorizontal size={19} /></span>
      </div>

      {featured ? (
        <div className="relative my-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#ede7f6] to-[#d1c4e9] p-3.5 dark:from-[#382d4d] dark:to-[#302741]">
          <span className="pointer-events-none absolute -bottom-10 right-3 h-28 w-28 rounded-full border border-[#5e35b1]/15" />
          <div className="relative z-10 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#5e35b1] dark:text-violet-200">Edificio con más aulas</span>
              <p className="mt-1 truncate text-xs font-bold text-[#121926] dark:text-white">{featured.nombre}</p>
              <span className="mt-1.5 inline-flex rounded-md bg-white/75 px-2 py-0.5 text-[9px] font-semibold text-[#5e35b1] dark:bg-black/20 dark:text-violet-100">
                {featured.ocupacion === null ? 'Sin secciones abiertas' : `${featured.ocupacion}% de ocupación`}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-base font-extrabold text-[#121926] dark:text-white">{featured.aulas_activas}</span>
              <p className="text-[9px] font-semibold text-[#5e35b1] dark:text-violet-200">aulas activas</p>
              <p className="text-[9px] text-[#697586] dark:text-stone-300">{featured.capacidad} cupos de sección</p>
            </div>
          </div>
          <div className="relative z-10 mt-3 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-black/20">
            <span className="block h-full rounded-full bg-[#5e35b1] transition-[width] duration-500" style={{ width: `${Math.min(featured.ocupacion ?? 0, 100)}%` }} />
          </div>
        </div>
      ) : (
        <div className="my-2 grid flex-1 place-items-center rounded-xl bg-[#f8fafc] text-center text-xs text-[#697586] dark:bg-white/5 dark:text-stone-400">No hay aulas registradas.</div>
      )}

      <div className="flex-1 space-y-2.5 pt-2">
        {buildings.map((building) => {
          const share = totalActiveRooms ? Math.round((building.aulas_activas / totalActiveRooms) * 100) : 0
          return (
            <div className="flex items-center justify-between gap-2 border-b border-[#edf0f4] py-2 last:border-0 dark:border-white/10" key={building.nombre}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold text-[#121926] dark:text-stone-100">{building.nombre}</p>
                <p className="mt-0.5 text-[9px] text-[#697586] dark:text-stone-400">{building.ocupacion === null ? 'Sin secciones abiertas' : `${building.ocupacion}% ocupación en secciones`}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] font-bold text-[#121926] dark:text-stone-100">{building.aulas_activas} aulas</span>
                <span className="grid h-6 min-w-6 place-items-center rounded-md bg-[#ede7f6] px-1 text-[8px] font-bold text-[#5e35b1] dark:bg-[#5e35b1]/20 dark:text-violet-200" title={`${share}% de aulas activas`}><Building2 size={11} /></span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-[#edf0f4] pt-3 dark:border-white/10">
        <span className="text-[9px] font-semibold text-[#697586] dark:text-stone-400">Infraestructura activa</span>
        <span className="rounded-md bg-[#ede7f6] px-2 py-1 text-[9px] font-extrabold text-[#5e35b1] dark:bg-[#5e35b1]/20 dark:text-violet-200">{totalActiveRooms} aulas</span>
      </div>
    </article>
  )
}
