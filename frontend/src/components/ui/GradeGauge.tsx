interface GradeGaugeProps {
  label: string
  value: number | string | null | undefined
  final?: boolean
}

function gradeTone(value: number) {
  if (value < 60) return { stroke: '#dc2626', text: 'Reprobada' }
  if (value < 70) return { stroke: '#d97706', text: 'Aprobada' }
  if (value < 85) return { stroke: '#2563eb', text: 'Aprobada' }
  return { stroke: '#059669', text: 'Excelente' }
}

export function GradeGauge({ label, value, final = false }: GradeGaugeProps) {
  const numericValue = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : Number.NaN
  if (!Number.isFinite(numericValue)) return <span aria-label={`${label}: sin nota`}>—</span>
  const boundedValue = Math.max(0, Math.min(100, numericValue))
  const tone = gradeTone(boundedValue)
  const display = boundedValue.toFixed(2)

  return <span className={`inline-grid shrink-0 place-items-center ${final ? 'h-12 w-12' : 'h-11 w-11'}`} role="img" aria-label={`${label}: ${display} puntos, ${tone.text}`}>
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-full w-full" focusable="false">
      {final && <circle cx="24" cy="24" r="21.5" fill="none" stroke={tone.stroke} strokeOpacity=".25" strokeWidth="1.5" />}
      <circle cx="24" cy="24" r="17.5" fill="none" stroke={tone.stroke} strokeWidth={final ? '3.5' : '3'} />
      <text x="24" y="24.5" textAnchor="middle" dominantBaseline="middle" fill="currentColor" className="fill-slate-800 text-[8px] font-semibold tabular-nums dark:fill-slate-100">{display}</text>
    </svg>
  </span>
}
