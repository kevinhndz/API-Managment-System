import { useEffect, useState } from 'react'

interface AnimatedMetricNumberProps {
  value: number
  decimals?: number
  suffix?: string
  className?: string
}

export function AnimatedMetricNumber({ value, decimals = 0, suffix = '', className = '' }: AnimatedMetricNumberProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const formatted = Number.isFinite(value) ? value.toLocaleString('es', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : '—'

  return (
    <span className={`metric-number inline-flex items-baseline tabular-nums ${className}`} aria-label={`${formatted}${suffix}`}>
      <span className="sr-only">{formatted}{suffix}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {[...formatted].map((character, index) => {
          if (!/\d/.test(character)) return <span key={`${index}-${character}`}>{character}</span>

          return (
            <span className="metric-digit" key={index}>
              <span className="metric-digit-strip" style={{ transform: `translateY(-${ready ? Number(character) * 10 : 0}%)`, transitionDelay: `${Math.min(index * 40, 200)}ms` }}>
                {Array.from({ length: 10 }, (_, digit) => <span key={digit}>{digit}</span>)}
              </span>
            </span>
          )
        })}
        {suffix && <span className="ml-1">{suffix}</span>}
      </span>
    </span>
  )
}
