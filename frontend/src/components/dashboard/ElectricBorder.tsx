import { useEffect, useRef } from 'react'

interface ElectricBorderProps {
  children: React.ReactNode
  color?: string
  speed?: number
  chaos?: number
  borderRadius?: number
  className?: string
}

export function ElectricBorder({ children, color = '#7df9ff', speed = 1, chaos = 0.12, borderRadius = 20, className = '' }: ElectricBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return undefined
    const context = canvas.getContext('2d')
    if (!context) return undefined
    let frame = 0
    let phase = 0
    const draw = () => {
      const rect = host.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, rect.width, rect.height)
      context.strokeStyle = color
      context.shadowColor = color
      context.shadowBlur = 10
      context.lineWidth = 1.5
      context.beginPath()
      const radius = borderRadius
      const points = 96
      for (let index = 0; index <= points; index += 1) {
        const t = index / points
        const angle = t * Math.PI * 2
        const perimeterX = rect.width / 2 + (rect.width / 2 - radius) * Math.sign(Math.cos(angle))
        const perimeterY = rect.height / 2 + (rect.height / 2 - radius) * Math.sign(Math.sin(angle))
        const x = rect.width / 2 + (perimeterX - rect.width / 2) * Math.abs(Math.cos(angle)) + Math.cos(angle) * radius
        const y = rect.height / 2 + (perimeterY - rect.height / 2) * Math.abs(Math.sin(angle)) + Math.sin(angle) * radius
        const jitter = Math.sin(phase + index * 1.7) * chaos * 3
        if (index === 0) context.moveTo(x + jitter, y + jitter)
        else context.lineTo(x + jitter, y + jitter)
      }
      context.closePath()
      context.stroke()
      phase += 0.04 * speed
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [borderRadius, chaos, color, speed])

  return <div className={`electric-border ${className}`} style={{ borderRadius }}><canvas ref={canvasRef} className="electric-border__canvas" aria-hidden="true" /><div className="electric-border__content">{children}</div></div>
}
