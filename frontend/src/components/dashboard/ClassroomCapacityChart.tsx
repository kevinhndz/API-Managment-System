import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ClassroomCapacityChartProps {
  aulas: { codigo: string; capacidad: number }[]
}

export function ClassroomCapacityChart({ aulas }: ClassroomCapacityChartProps) {
  const data = aulas

  return (
    <article className="berry-surface rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-[0_2px_14px_rgba(32,40,45,.06)] sm:p-6 dark:border-white/10 dark:bg-[#211e2b]">
      <div>
        <h3 className="font-semibold tracking-tight text-[#121926] dark:text-white">Capacidad por aula</h3>
        <p className="mt-1 text-[10px] text-[#697586] dark:text-stone-400">Hasta ocho aulas con mayor capacidad</p>
      </div>
      {data.length === 0 ? (
        <div className="grid h-48 place-items-center text-center text-xs text-[#697586] dark:text-stone-400">No hay capacidad registrada para graficar.</div>
      ) : (
        <div className="mt-4 h-48 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#d8dee8" opacity={0.7} />
              <XAxis dataKey="codigo" axisLine={false} tickLine={false} tick={{ fill: '#697586', fontSize: 9 }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 9 }} />
              <Tooltip cursor={{ fill: '#ede7f6', opacity: 0.6 }} contentStyle={{ borderRadius: 10, borderColor: '#e3e8ef', fontSize: 10 }} formatter={(value) => [`${String(value)} cupos`, 'Capacidad']} />
              <Bar dataKey="capacidad" fill="#5e35b1" radius={[5, 5, 2, 2]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
