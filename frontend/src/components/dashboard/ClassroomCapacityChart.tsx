import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { Aula } from '../../types/api'

interface ClassroomCapacityChartProps {
  aulas: Aula[]
}

export function ClassroomCapacityChart({ aulas }: ClassroomCapacityChartProps) {
  const data = [...aulas]
    .sort((first, second) => second.capacidad - first.capacidad)
    .slice(0, 8)
    .map((aula) => ({ codigo: aula.codigo, capacidad: aula.capacidad }))

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-panel dark:bg-slate-900 sm:p-6">
      <div>
        <h3 className="font-semibold tracking-tight text-navy-950 dark:text-white">Capacidad por aula</h3>
        <p className="mt-1 text-xs text-slate-500">Hasta ocho aulas con mayor capacidad</p>
      </div>
      {data.length === 0 ? (
        <div className="grid h-72 place-items-center text-center text-sm text-slate-400">No hay capacidad registrada para graficar.</div>
      ) : (
        <div className="mt-6 h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" opacity={0.7} />
              <XAxis dataKey="codigo" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip cursor={{ fill: '#f1f5f9', opacity: 0.6 }} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} formatter={(value) => [`${String(value)} cupos`, 'Capacidad']} />
              <Bar dataKey="capacidad" fill="#378b64" radius={[6, 6, 2, 2]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
