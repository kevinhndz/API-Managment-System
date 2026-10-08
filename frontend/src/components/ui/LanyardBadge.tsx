import { useEffect, useRef, useState, type ReactNode } from 'react'

interface LanyardBadgeProps {
  front: ReactNode
  back: ReactNode
  cardWidth?: number
  height?: number
  reducedMotion?: boolean
}

interface SwingState {
  x: number
  y: number
  targetX: number
  targetY: number
  velocityX: number
  velocityY: number
  dragging: boolean
  pointerId: number | null
  startX: number
  startY: number
  originX: number
  originY: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function drawStrap(
  context: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  endY: number,
  width: number,
) {
  const controlX = (startX + endX) / 2
  const controlY = endY * 0.36

  context.beginPath()
  context.moveTo(startX, -18)
  context.quadraticCurveTo(controlX, controlY, endX, endY)
  context.lineCap = 'round'
  context.lineWidth = width + 5
  context.strokeStyle = 'rgba(30, 5, 8, 0.28)'
  context.stroke()

  const ribbon = context.createLinearGradient(startX, 0, endX, endY)
  ribbon.addColorStop(0, '#3d070b')
  ribbon.addColorStop(0.48, '#760b16')
  ribbon.addColorStop(1, '#3d070b')
  context.beginPath()
  context.moveTo(startX, -18)
  context.quadraticCurveTo(controlX, controlY, endX, endY)
  context.lineWidth = width
  context.strokeStyle = ribbon
  context.stroke()

  context.beginPath()
  context.moveTo(startX - width * 0.19, -12)
  context.quadraticCurveTo(controlX - width * 0.12, controlY, endX - width * 0.15, endY)
  context.lineWidth = 1
  context.strokeStyle = 'rgba(244, 208, 164, 0.8)'
  context.stroke()
}

function drawMetal(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const metal = context.createLinearGradient(x, y, x + width, y)
  metal.addColorStop(0, '#7e756b')
  metal.addColorStop(0.35, '#fff4df')
  metal.addColorStop(0.65, '#b7a58d')
  metal.addColorStop(1, '#eee2ce')
  context.fillStyle = metal
  context.shadowColor = 'rgba(23, 12, 8, 0.25)'
  context.shadowBlur = 5
  context.beginPath()
  context.roundRect(x, y, width, height, 4)
  context.fill()
  context.shadowBlur = 0
}

export function LanyardBadge({ front, back, cardWidth = 232, height = 610, reducedMotion }: LanyardBadgeProps) {
  const stageRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const faceRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<() => void>(() => undefined)
  const showBackRef = useRef(false)
  const [systemReducedMotion, setSystemReducedMotion] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const respectReducedMotion = reducedMotion ?? systemReducedMotion

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystemReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  showBackRef.current = showBack

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    const card = cardRef.current
    const context = canvas?.getContext('2d')
    if (!stage || !canvas || !card) return undefined

    const state: SwingState = {
      x: reducedMotion ? 0 : 24,
      y: 0,
      targetX: 0,
      targetY: 0,
      velocityX: 0,
      velocityY: 0,
      dragging: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
    }
    const cardHeight = cardWidth * 1.5
    const strapWidth = Math.max(17, cardWidth * 0.095)
    let frame = 0
    let lastFrame = 0
    let elapsed = 0
    let stageWidth = 1
    let stageHeight = 1
    let pixelRatio = 1

    const measure = () => {
      const bounds = stage.getBoundingClientRect()
      stageWidth = Math.max(1, bounds.width)
      stageHeight = Math.max(1, bounds.height)
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(stageWidth * pixelRatio)
      canvas.height = Math.round(stageHeight * pixelRatio)
      canvas.style.width = `${stageWidth}px`
      canvas.style.height = `${stageHeight}px`
    }

    const flip = () => setShowBack((value) => !value)
    flipRef.current = flip

    const draw = () => {
      const centerX = stageWidth / 2
      const buckleY = clamp(stageHeight * 0.3, 150, stageHeight - cardHeight - 105)
      const buckleX = centerX + state.x * 0.48
      const ringY = buckleY + 68 + state.y * 0.22
      const cardTop = ringY + 23
      const sway = respectReducedMotion ? 0 : Math.sin(elapsed * 0.72) * 2.2

      const angle = clamp(-state.x * 0.0008 - state.velocityX * 0.000025, -0.13, 0.13)
      card.style.transform = `translate3d(calc(-50% + ${state.x}px), ${cardTop}px, 0) rotate(${angle}rad)`
      if (faceRef.current) faceRef.current.style.transform = showBackRef.current ? 'rotateY(180deg)' : 'rotateY(0deg)'
      if (!context) return

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, stageWidth, stageHeight)
      drawStrap(context, centerX - 34, buckleX, buckleY, strapWidth)
      drawStrap(context, centerX + 34, buckleX, buckleY, strapWidth)

      context.beginPath()
      context.moveTo(buckleX, buckleY + 8)
      context.lineTo(buckleX + sway, ringY)
      context.lineCap = 'round'
      context.lineWidth = strapWidth * 0.72
      context.strokeStyle = '#650a13'
      context.stroke()
      context.beginPath()
      context.moveTo(buckleX - 2, buckleY + 10)
      context.lineTo(buckleX + sway - 2, ringY)
      context.lineWidth = 1
      context.strokeStyle = 'rgba(244, 208, 164, 0.72)'
      context.stroke()

      drawMetal(context, buckleX - 13, buckleY - 8, 26, 19)
      context.beginPath()
      context.arc(buckleX + sway, ringY, 10, 0, Math.PI * 2)
      context.lineWidth = 4
      context.strokeStyle = '#c8b99f'
      context.stroke()

    }

    const tick = (time: number) => {
      const delta = Math.min(0.04, lastFrame ? (time - lastFrame) / 1000 : 0)
      lastFrame = time
      elapsed += delta

      const previousX = state.x
      const previousY = state.y
      state.x += (state.targetX - state.x) * (state.dragging ? 0.42 : 0.11)
      state.y += (state.targetY - state.y) * (state.dragging ? 0.42 : 0.11)
      state.velocityX = delta ? (state.x - previousX) / delta : 0
      state.velocityY = delta ? (state.y - previousY) / delta : 0
      draw()
      frame = requestAnimationFrame(tick)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      state.dragging = true
      state.pointerId = event.pointerId
      state.startX = event.clientX
      state.startY = event.clientY
      state.originX = event.clientX
      state.originY = event.clientY
      card.setPointerCapture(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!state.dragging || event.pointerId !== state.pointerId) return
      state.targetX = clamp(state.x + event.clientX - state.startX, -stageWidth * 0.32, stageWidth * 0.32)
      state.targetY = clamp(state.y + event.clientY - state.startY, -45, 65)
      state.startX = event.clientX
      state.startY = event.clientY
    }
    const onPointerUp = (event: PointerEvent) => {
      if (!state.dragging || event.pointerId !== state.pointerId) return
      state.dragging = false
      state.pointerId = null
      state.targetX = 0
      state.targetY = 0
      if (Math.hypot(event.clientX - state.originX, event.clientY - state.originY) < 8) flipRef.current()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        flipRef.current()
      }
    }

    measure()
    draw()
    frame = requestAnimationFrame(tick)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(stage)
    card.addEventListener('pointerdown', onPointerDown)
    card.addEventListener('pointermove', onPointerMove)
    card.addEventListener('pointerup', onPointerUp)
    card.addEventListener('pointercancel', onPointerUp)
    card.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      card.removeEventListener('pointerdown', onPointerDown)
      card.removeEventListener('pointermove', onPointerMove)
      card.removeEventListener('pointerup', onPointerUp)
      card.removeEventListener('pointercancel', onPointerUp)
      card.removeEventListener('keydown', onKeyDown)
    }
  }, [cardWidth, height, respectReducedMotion])

  return (
    <section ref={stageRef} className="relative w-full overflow-hidden select-none" style={{ height }} aria-label="Carnet estudiantil interactivo">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 block" aria-hidden="true" />
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label={showBack ? 'Carnet por el reverso. Activar para ver el frente.' : 'Carnet por el frente. Activar para ver el reverso.'}
        aria-pressed={showBack}
        className="absolute left-1/2 top-0 z-10 cursor-grab outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[#7b4bd9]"
        style={{ width: cardWidth, height: cardWidth * 1.5, transformOrigin: '50% 0', touchAction: 'none', perspective: 1000 }}
      >
        <div ref={faceRef} className="relative h-full w-full rounded-[20px] shadow-[0_22px_48px_-18px_rgba(30,5,8,0.55)]" style={{ transform: 'rotateY(0deg)', transformStyle: 'preserve-3d', transition: respectReducedMotion ? 'none' : 'transform 650ms cubic-bezier(0.2, 0.75, 0.2, 1)' }}>
          <div className="absolute inset-0 overflow-hidden rounded-[20px] border border-white/50 bg-[#fffdf8] [backface-visibility:hidden]">{front}</div>
          <div className="absolute inset-0 overflow-hidden rounded-[20px] border border-white/50 bg-[#fffdf8] [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</div>
        </div>
      </div>
      <p className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/60 bg-white/75 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur dark:border-[#39334b] dark:bg-[#242033]/90 dark:text-stone-200">
        Arrastra para mover · Toca para voltear
      </p>
    </section>
  )
}
