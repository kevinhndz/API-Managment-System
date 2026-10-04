import { useState } from 'react'

interface FunnelStage { label: string; value: number }
interface AcademicFunnelProps { title: string; stages: FunnelStage[]; tone: 'blue' | 'orange' }

export function AcademicFunnel({ title, stages, tone }: AcademicFunnelProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(...stages.map((stage) => stage.value), 1)
  const base = tone === 'blue' ? '#123fc4' : '#e88900'
  const edge = tone === 'blue' ? '#06194e' : '#613000'
  const light = tone === 'blue' ? '#2655e8' : '#f6a329'
  const pattern = `academic-funnel-${tone}`
  const ys = stages.map((_, index) => 18 + index * (484 / Math.max(stages.length, 1)))
  const widths = stages.map((stage) => 32 + (stage.value / max) * 165)
  return <article className="glass-card rounded-[1.25rem] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a716f]">Visualización del ciclo</p><h3 className="mt-2 font-semibold tracking-tight text-[#1a1c1a] dark:text-white">{title}</h3><p className="mt-1 text-xs text-[#8a716f]">Pasa el cursor sobre una etapa</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tone === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200'}`}>Actual</span></div><div className="mt-4 overflow-x-auto pb-1"><svg className="mx-auto h-[27rem] min-w-[22rem] max-w-full" viewBox="0 0 500 540" role="img" aria-label={`Embudo vertical de ${title}`}><defs><pattern id={pattern} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill={base} /><path d="M0 0V9" stroke="#fff" strokeOpacity=".3" strokeWidth="2" /></pattern></defs>{stages.map((stage, index) => { const y = ys[index]; const nextY = ys[index + 1] ?? 522; const width = widths[index] * (hovered === index ? 1.08 : 1); const nextWidth = (widths[index + 1] ?? width * .58) * (hovered === index ? 1.08 : 1); const d = `M ${250 - width} ${y} C ${250 - width} ${y + 32}, ${250 - nextWidth} ${nextY - 32}, ${250 - nextWidth} ${nextY} L ${250 + nextWidth} ${nextY} C ${250 + nextWidth} ${nextY - 32}, ${250 + width} ${y + 32}, ${250 + width} ${y} Z`; const percent = Math.round((stage.value / max) * 100); return <g key={stage.label} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} className="cursor-pointer"><path d={d} fill={hovered === index ? light : `url(#${pattern})`} stroke={edge} strokeWidth={hovered === index ? 18 : 12} strokeLinejoin="round" style={{ transition: 'fill 220ms ease, stroke 220ms ease' }} /><rect x="211" y={y + 45} width="78" height="34" rx="18" fill="#fff0f3" /><text x="250" y={y + 67} textAnchor="middle" fontSize="15" fontWeight="700" fill="#201619">{percent}%</text><text x={250 - width - 18} y={y + 60} textAnchor="end" fontSize="13" fill="currentColor">{stage.value.toLocaleString('es')}</text><text x={250 + width + 18} y={y + 60} fontSize="13" fill="currentColor">{stage.label}</text></g> })}</svg></div></article>
}
