import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface EnrollmentTrendChartProps {
  trend: { mes: number; activas: number; canceladas: number; finalizadas: number }[]
  year: number
  periodLabel: string
}
const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function EnrollmentTrendChart({ trend, year, periodLabel }: EnrollmentTrendChartProps) {
  const data = months.map((month, index) => {
    const entry = trend.find((item) => item.mes === index + 1)
    return { month, total: (entry?.activas ?? 0) + (entry?.canceladas ?? 0) + (entry?.finalizadas ?? 0) }
  })
  const total = data.reduce((sum, month) => sum + month.total, 0)
  return <article className="academic-enrollment-chart">
    <header><div><h2>Matrículas por mes</h2><p>{total.toLocaleString('es-HN')} registradas en {year}</p></div><span>Año lectivo actual</span></header>
    {total === 0 ? <p className="academic-empty">No hay matrículas de este año para mostrar.</p> : <div className="academic-enrollment-plot" aria-label={`Matrículas mensuales de ${year}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 28, right: 8, left: -20, bottom: 4 }} barCategoryGap="25%" accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" axisLine={{ stroke: '#e2e8f0' }} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} interval={0} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip cursor={{ fill: '#eff4ff' }} contentStyle={{ borderRadius: 6, borderColor: '#e2e8f0', fontSize: 12 }} formatter={(value) => [String(value), 'Matrículas']} />
          <Bar dataKey="total" name="Matrículas" fill="#5b32d6" radius={[2, 2, 0, 0]} maxBarSize={34} isAnimationActive={false}>
            <LabelList dataKey="total" position="top" fill="#5b32d6" fontSize={11} formatter={(value) => Number(value) > 0 ? String(value) : '—'} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>}
    <footer><span>Datos correspondientes a registros del año lectivo</span><span>{periodLabel}</span></footer>
  </article>
}
