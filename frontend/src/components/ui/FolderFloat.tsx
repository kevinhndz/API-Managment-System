import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Matter from 'matter-js'

import './FolderFloat.css'

const { Bodies, Body, Composite, Engine } = Matter

const ROW_HEIGHT = 38
const ITEM_GAP = 10

export interface FolderFloatItem {
  label: string
  value: string
}

interface FolderFloatProps {
  items: FolderFloatItem[]
  label: string
  sublabel?: string
  trigger?: 'hover' | 'click'
  closeOnSelect?: boolean
  physics?: boolean
  drift?: number
  folderColor?: string
  frontColor?: string
  paperColor?: string
  itemColor?: string
  itemTextColor?: string
  labelColor?: string
  width?: number
  height?: number
  radius?: number
  spread?: number
  lift?: number
  openDuration?: number
  stagger?: number
  className?: string
  onSelect?: (value: string, index: number) => void
}

interface Position {
  x: number
  y: number
  angle: number
}

interface PillSize {
  width: number
  height: number
}

const phaseFor = (index: number) => {
  const seed = Math.sin(index * 12.9898 + 4.1414) * 43758.5453
  return (seed - Math.floor(seed)) * Math.PI * 2
}

function arrangeItems(items: FolderFloatItem[], spread: number, lift: number, sizes: PillSize[]): Position[] {
  const positions: Position[] = []
  let row: Array<{ index: number; width: number }> = []
  let rowWidth = 0
  let rowIndex = 0

  const placeRow = (rowIndex: number) => {
    let x = -rowWidth / 2

    row.forEach(({ index, width }) => {
      const centerX = x + width / 2
      const y = -lift - rowIndex * ROW_HEIGHT
      positions[index] = { x: centerX, y, angle: (phaseFor(index) / Math.PI - 1) * 4 }
      x += width + ITEM_GAP
    })
  }

  items.forEach((item, index) => {
    const width = sizes[index]?.width ?? Math.min(116, 24 + item.label.length * 6)
    const nextWidth = rowWidth + (row.length ? ITEM_GAP : 0) + width

    if (row.length && nextWidth > spread * 2) {
      placeRow(rowIndex)
      rowIndex += 1
      row = []
      rowWidth = 0
    }

    row.push({ index, width })
    rowWidth += (row.length > 1 ? ITEM_GAP : 0) + width
  })

  if (row.length) placeRow(rowIndex)

  return positions
}

export function FolderFloat({
  items,
  label,
  sublabel = `${items.length} opciones`,
  trigger = 'hover',
  closeOnSelect = true,
  physics = true,
  drift = 0.35,
  folderColor = '#5b0309',
  frontColor = '#8f1721',
  paperColor = '#fff8f4',
  itemColor = '#fff4f2',
  itemTextColor = '#351215',
  labelColor = '#fff8f4',
  width = 92,
  height = 34,
  radius = 9,
  spread = 104,
  lift = 12,
  openDuration = 260,
  stagger = 38,
  className = '',
  onSelect,
}: FolderFloatProps) {
  const [open, setOpen] = useState(false)
  const [live, setLive] = useState(false)
  const [sizes, setSizes] = useState<PillSize[]>([])
  const anchorRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pillRefs = useRef<Array<HTMLButtonElement | null>>([])
  const engineRef = useRef<Matter.Engine | null>(null)
  const bodiesRef = useRef<Matter.Body[]>([])
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef(0)
  const previousFrameRef = useRef(0)
  const closeTimerRef = useRef<number | undefined>(undefined)
  const reduceMotionRef = useRef(false)

  const positions = useMemo(() => arrangeItems(items, spread, lift, sizes), [items, lift, sizes, spread])

  useLayoutEffect(() => {
    const measure = () => {
      const nextSizes = pillRefs.current.slice(0, items.length).map((element) => (
        element ? { width: element.offsetWidth, height: element.offsetHeight } : null
      ))

      if (nextSizes.some((size) => !size)) return
      setSizes(nextSizes as PillSize[])
    }

    measure()
    document.fonts?.ready.then(measure)
  }, [items])

  const stopPhysics = useCallback((updateState = true) => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0

    if (engineRef.current) {
      Composite.clear(engineRef.current.world, false, true)
      Engine.clear(engineRef.current)
      engineRef.current = null
    }

    bodiesRef.current = []
    if (updateState) setLive(false)
  }, [])

  const startPhysics = useCallback(() => {
    if (!physics || reduceMotionRef.current || engineRef.current || !anchorRef.current) return

    const elements = pillRefs.current.slice(0, items.length)
    if (elements.some((element) => !element)) return

    const measured = elements.map((element) => ({ width: element!.offsetWidth, height: element!.offsetHeight }))
    const engine = Engine.create({ gravity: { x: 0, y: 0 } })
    const bodies = elements.map((_, index) => {
      const position = positions[index]
      const size = measured[index]
      const body = Bodies.rectangle(position.x, position.y + size.height / 2, size.width, size.height, {
        chamfer: { radius: Math.max(1, Math.min(size.height / 2 - 1, 14)) },
        restitution: 0.42,
        friction: 0,
        frictionAir: 0.08,
        inertia: Infinity,
      })

      body.plugin = { phase: phaseFor(index) }
      return body
    })

    const top = Math.min(...positions.map((position) => position.y)) - 8
    const bottom = -lift + Math.max(...measured.map((size) => size.height))
    const wall = 70
    const walls = [
      Bodies.rectangle(0, top - wall / 2, spread * 2 + wall * 2, wall, { isStatic: true }),
      Bodies.rectangle(0, bottom + wall / 2, spread * 2 + wall * 2, wall, { isStatic: true }),
      Bodies.rectangle(-spread - wall / 2, (top + bottom) / 2, wall, bottom - top + wall * 2, { isStatic: true }),
      Bodies.rectangle(spread + wall / 2, (top + bottom) / 2, wall, bottom - top + wall * 2, { isStatic: true }),
    ]

    Composite.add(engine.world, [...bodies, ...walls])
    engineRef.current = engine
    bodiesRef.current = bodies
    startTimeRef.current = performance.now()
    previousFrameRef.current = 0
    setLive(true)

    const tick = (now: number) => {
      const activeEngine = engineRef.current
      if (!activeEngine) return

      const delta = previousFrameRef.current ? Math.min(32, now - previousFrameRef.current) : 16
      previousFrameRef.current = now
      const elapsed = (now - startTimeRef.current) / 1000
      const force = drift * 0.00004 * Math.min(1, elapsed / 1.5)

      bodiesRef.current.forEach((body, index) => {
        const phase = (body.plugin as { phase: number }).phase
        Body.applyForce(body, body.position, {
          x: Math.sin(elapsed + phase) * force * body.mass,
          y: Math.cos(elapsed * 1.2 + phase) * force * body.mass,
        })

        const element = pillRefs.current[index]
        if (!element) return
        element.style.setProperty('--ff-x', `${body.position.x.toFixed(1)}px`)
        element.style.setProperty('--ff-y', `${(body.position.y - measured[index].height / 2).toFixed(1)}px`)
      })

      Engine.update(activeEngine, delta)
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [drift, items, lift, physics, positions, spread])

  const setFolderOpen = useCallback((next: boolean) => {
    if (!next) stopPhysics()
    setOpen(next)
  }, [stopPhysics])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { reduceMotionRef.current = query.matches }

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!open || !physics || reduceMotionRef.current) return undefined
    const timer = window.setTimeout(startPhysics, openDuration + (items.length - 1) * stagger + 60)
    return () => window.clearTimeout(timer)
  }, [items.length, open, openDuration, physics, stagger, startPhysics])

  useEffect(() => () => {
    window.clearTimeout(closeTimerRef.current)
    stopPhysics(false)
  }, [stopPhysics])

  const handlePointerEnter = () => {
    window.clearTimeout(closeTimerRef.current)
    setFolderOpen(true)
  }

  const handlePointerLeave = () => {
    if (trigger !== 'hover') return
    closeTimerRef.current = window.setTimeout(() => setFolderOpen(false), 100)
  }

  const selectItem = (value: string, index: number) => {
    onSelect?.(value, index)
    if (closeOnSelect) setFolderOpen(false)
  }

  const style = {
    '--ff-w': `${width}px`,
    '--ff-h': `${height}px`,
    '--ff-r': `${radius}px`,
    '--ff-back': folderColor,
    '--ff-front': frontColor,
    '--ff-paper': paperColor,
    '--ff-item': itemColor,
    '--ff-item-ink': itemTextColor,
    '--ff-label': labelColor,
    '--ff-spread': `${spread}px`,
    '--ff-lift': `${lift}px`,
    '--ff-open': `${openDuration}ms`,
    '--ff-stagger': `${stagger}ms`,
    '--ff-count': items.length,
  } as CSSProperties

  return (
    <div
      className={`folder-float${className ? ` ${className}` : ''}`}
      data-open={open ? '' : undefined}
      data-live={live ? '' : undefined}
      data-physics={physics ? '' : undefined}
      onPointerEnter={trigger === 'hover' ? handlePointerEnter : undefined}
      onPointerLeave={handlePointerLeave}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation()
          setFolderOpen(false)
          triggerRef.current?.focus()
        }
        if (event.key === 'ArrowDown' && event.target === triggerRef.current) {
          event.preventDefault()
          pillRefs.current[0]?.focus()
        }
      }}
      style={style}
    >
      <div ref={anchorRef} className="folder-float__items" role="menu" aria-label={label}>
        {items.map((item, index) => {
          const position = positions[index] ?? { x: 0, y: -lift, angle: 0 }

          return (
            <button
              key={item.value}
              ref={(element) => { pillRefs.current[index] = element }}
              type="button"
              className="folder-float__item"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              style={{
                '--ff-i': index,
                '--ff-x': `${position.x.toFixed(1)}px`,
                '--ff-y': `${position.y.toFixed(1)}px`,
                '--ff-angle': `${position.angle.toFixed(1)}deg`,
              } as CSSProperties}
              onClick={() => selectItem(item.value, index)}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="folder-float__folder">
        <span className="folder-float__back" aria-hidden="true" />
        <span className="folder-float__paper" aria-hidden="true" />
        <span className="folder-float__front" aria-hidden="true">
          <span className="folder-float__label">{label}</span>
          <span className="folder-float__sub">{sublabel}</span>
        </span>
        <button
          ref={triggerRef}
          type="button"
          className="folder-float__trigger"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setFolderOpen(!open)}
        />
      </div>
    </div>
  )
}
