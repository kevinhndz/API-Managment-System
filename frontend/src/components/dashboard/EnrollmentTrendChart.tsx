import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { Matricula } from '../../types/api'

interface EnrollmentTrendChartProps {
  matriculas: Matricula[]
  year: number
  periodLabel: string
}

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function EnrollmentTrendChart({ matriculas, year, periodLabel }: EnrollmentTrendChartProps) {
  const data = months.map((month, index) => {
    const records = matriculas.filter((matricula) => {
      const [recordYear, recordMonth] = matricula.fecha_matricula.slice(0, 10).split('-').map(Number)
      return recordYear === year && recordMonth === index + 1
    })

    return {
      month,
      activas: records.filter((record) => record.estado.toLocaleUpperCase('es') === 'ACTIVA').length,
      canceladas: records.filter((record) => record.estado.toLocaleUpperCase('es') === 'CANCELADA').length,
      finalizadas: records.filter((record) => ['APROBADA', 'REPROBADA'].includes(record.estado.toLocaleUpperCase('es'))).length,
    }
  })
  const total = data.reduce((sum, month) => sum + month.activas + month.canceladas + month.finalizadas, 0)

  return (
    <article className="berry-surface flex min-h-[350px] flex-col rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-[0_2px_14px_rgba(32,40,45,.06)] sm:p-6 dark:border-white/10 dark:bg-[#211e2b]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#edf0f4] pb-4 dark:border-white/10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#697586] dark:text-stone-400">Crecimiento académico</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#121926] dark:text-white">{total.toLocaleString('es')}</h2>
            <span className="text-[10px] font-semibold text-[#697586] dark:text-stone-400">matrículas registradas en {year}</span>
          </div>
        </div>
        <span className="rounded-lg border border-[#e3e8ef] bg-[#f8fafc] px-3 py-2 text-[10px] font-semibold text-[#394150] dark:border-white/10 dark:bg-white/5 dark:text-stone-200">{periodLabel}</span>
      </div>

      {total === 0 ? (
        <div className="grid flex-1 place-items-center py-10 text-center text-xs text-[#697586] dark:text-stone-400">No hay matrículas de este año para mostrar.</div>
      ) : (
        <div className="mt-4 h-[230px] min-w-0">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#d8dee8" opacity={0.65} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#697586', fontSize: 9 }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 9 }} />
              <Tooltip cursor={{ fill: '#ede7f6', opacity: 0.5 }} contentStyle={{ borderRadius: 10, borderColor: '#e3e8ef', fontSize: 11 }} formatter={(value, name) => [String(value), String(name)]} />
              <Bar dataKey="activas" name="Activas" stackId="matriculas" fill="#5e35b1" radius={[0, 0, 2, 2]} />
              <Bar dataKey="canceladas" name="Canceladas" stackId="matriculas" fill="#2196f3" />
              <Bar dataKey="finalizadas" name="Finalizadas" stackId="matriculas" fill="#d1c4e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-[#edf0f4] pt-3 dark:border-white/10">
        <span className="flex items-center gap-1.5 text-[9px] font-semibold text-[#697586] dark:text-stone-300"><i className="h-2.5 w-2.5 rounded-sm bg-[#5e35b1]" />Activas</span>
        <span className="flex items-center gap-1.5 text-[9px] font-semibold text-[#697586] dark:text-stone-300"><i className="h-2.5 w-2.5 rounded-sm bg-[#2196f3]" />Canceladas</span>
        <span className="flex items-center gap-1.5 text-[9px] font-semibold text-[#697586] dark:text-stone-300"><i className="h-2.5 w-2.5 rounded-sm bg-[#d1c4e9]" />Finalizadas</span>
      </div>
    </article>
  )
}
