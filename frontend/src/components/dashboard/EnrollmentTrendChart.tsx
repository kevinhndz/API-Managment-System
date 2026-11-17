import { useId } from 'react'

interface EnrollmentTrendChartProps {
  trend: { mes: number; activas: number; canceladas: number; finalizadas: number }[]
  year: number
  periodLabel: string
}
const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function EnrollmentTrendChart({ trend, year, periodLabel }: EnrollmentTrendChartProps) {
  const titleId = useId()
  const data = months.map((month, index) => {
    const entry = trend.find((item) => item.mes === index + 1)
    return { month, total: (entry?.activas ?? 0) + (entry?.canceladas ?? 0) + (entry?.finalizadas ?? 0) }
  })
  const total = data.reduce((sum, month) => sum + month.total, 0)
  const maximum = Math.max(1, ...data.map((item) => item.total))
  const magnitude = 10 ** Math.floor(Math.log10(maximum))
  const top = Math.max(4, Math.ceil(maximum / magnitude) * magnitude)
  const baseline = 264
  const plotHeight = 224
  return <article className="academic-enrollment-chart">
    <header><div><h2>Matrículas por mes</h2><p>{total.toLocaleString('es-HN')} registradas en {year}</p></div><span>Año lectivo actual</span></header>
    {total === 0 ? <p className="academic-empty">No hay matrículas de este año para mostrar.</p> : <div className="academic-enrollment-plot">
      <svg viewBox="0 0 720 300" role="img" aria-labelledby={titleId}>
        <title id={titleId}>Matrículas mensuales de {year}: {data.map((item) => `${item.month} ${item.total}`).join(', ')}</title>
        {[0, 1, 2, 3, 4].map((tick) => {
          const y = baseline - tick / 4 * plotHeight
          return <g key={tick}><line x1={44} x2={712} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={tick ? '3 3' : undefined} /><text x={34} y={y + 4} fill="#797486" fontSize={12} textAnchor="end">{Math.round(top * tick / 4)}</text></g>
        })}
        {data.map((item, index) => {
          const x = 72 + index * 55
          const height = item.total / top * plotHeight
          return <g key={item.month}>
            {item.total > 0 && <rect x={x - 17} y={baseline - height} width={34} height={height} rx={2} fill="#5b32d6"><title>{item.month}: {item.total} matrículas</title></rect>}
            <text x={x} y={item.total ? baseline - height - 9 : baseline - 8} textAnchor="middle" fontSize={11} fill={item.total ? '#5b32d6' : '#94a3b8'}>{item.total || '—'}</text>
            <text x={x} y={290} textAnchor="middle" fontSize={12} fill={item.total ? '#5b32d6' : '#797486'}>{item.month}</text>
          </g>
        })}
      </svg>
    </div>}
    <footer><span>Datos correspondientes a registros del año lectivo</span><span>{periodLabel}</span></footer>
  </article>
}
