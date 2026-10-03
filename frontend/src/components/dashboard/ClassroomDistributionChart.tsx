import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import type { Aula } from '../../types/api'

interface ClassroomDistributionChartProps {
  aulas: Aula[]
}

const colors = ['#24466e', '#378b64', '#d49a45']

export function ClassroomDistributionChart({ aulas }: ClassroomDistributionChartProps) {
  const data = Object.entries(
    aulas.reduce<Record<string, number>>((result, aula) => {
      result[aula.edificio] = (result[aula.edificio] ?? 0) + 1
      return result
    }, {}),
  ).map(([name, value]) => ({ name: name.replace('Edificio ', ''), value }))

  return (
    <article className="rounded-2xl border bg-[#fffdf8] p-5 shadow-panel dark:bg-stone-900 sm:p-6">
      <div>
        <h3 className="font-semibold tracking-tight text-navy-950 dark:text-white">Distribución de aulas</h3>
        <p className="mt-1 text-xs text-slate-500">Registros agrupados por edificio</p>
      </div>
      {data.length === 0 ? (
        <div className="grid h-72 place-items-center text-center text-sm text-slate-400">No hay aulas registradas para graficar.</div>
      ) : (
        <div className="mt-4 grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4} strokeWidth={0}>
                  {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} formatter={(value) => [`${String(value)} aulas`, 'Total']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-3 sm:min-w-36">
            {data.map((item, index) => (
              <li className="flex items-center justify-between gap-6 text-xs" key={item.name}>
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  {item.name}
                </span>
                <strong className="text-slate-800 dark:text-slate-200">{item.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
