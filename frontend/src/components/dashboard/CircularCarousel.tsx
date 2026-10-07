import { useRef, useState, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselItem {
  src: string
  alt: string
  title: string
  subtitle: string
}

interface CircularCarouselProps {
  items: CarouselItem[]
}

interface DragState {
  pointerId: number
  startX: number
  startPosition: number
  cardWidth: number
}

function wrapIndex(index: number, length: number) {
  return length ? ((index % length) + length) % length : 0
}

function shortestOffset(index: number, position: number, length: number) {
  if (!length) return 0

  let offset = index - position
  offset = ((offset % length) + length) % length

  if (offset > length / 2) offset -= length

  return offset
}

export function CircularCarousel({ items }: CircularCarouselProps) {
  const firstCardRef = useRef<HTMLButtonElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const draggedRef = useRef(false)
  const [position, setPosition] = useState(0)
  const [preview, setPreview] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const active = wrapIndex(Math.round(position), items.length)
  const detailIndex = preview ?? active

  function goTo(index: number) {
    setPosition((currentPosition) => {
      const currentIndex = wrapIndex(Math.round(currentPosition), items.length)
      const offset = shortestOffset(index, currentIndex, items.length)

      return currentPosition + offset
    })
  }

  function moveBy(amount: number) {
    setPosition((currentPosition) => currentPosition + amount)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !items.length) return

    const cardWidth = firstCardRef.current?.getBoundingClientRect().width ?? 0
    if (!cardWidth) return

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startPosition: position,
      cardWidth,
    }

    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const distance = event.clientX - drag.startX

    if (Math.abs(distance) > 5) draggedRef.current = true

    setPosition(drag.startPosition - distance / (drag.cardWidth * 0.74))
  }

  function finishDragging(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    dragRef.current = null
    setIsDragging(false)
    setPosition((currentPosition) => Math.round(currentPosition))

    if (draggedRef.current) {
      window.setTimeout(() => {
        draggedRef.current = false
      }, 0)
    }
  }

  return (
    <section className="circular-carousel" aria-label="Resumen del campus">
      {!items.length ? (
        <p className="circular-carousel__empty">No hay metricas para mostrar.</p>
      ) : (
        <>
          <div className="circular-carousel__controls" aria-label="Controles del album">
            <button
              className="circular-carousel__arrow"
              type="button"
              aria-label="Tarjeta anterior"
              onClick={() => moveBy(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <span className="circular-carousel__position" aria-live="polite">
              {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <button
              className="circular-carousel__arrow"
              type="button"
              aria-label="Tarjeta siguiente"
              onClick={() => moveBy(1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>

          <div
            className={`circular-carousel__stage${isDragging ? ' is-dragging' : ''}`}
            role="region"
            aria-roledescription="carrusel"
            aria-label="Album de metricas del campus"
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDragging}
            onPointerCancel={finishDragging}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault()
                moveBy(-1)
              } else if (event.key === 'ArrowRight') {
                event.preventDefault()
                moveBy(1)
              }
            }}
          >
            {items.map((item, index) => {
              const offset = shortestOffset(index, position, items.length)
              const distance = Math.abs(offset)
              const visible = distance < 3.5
              const ramp = Math.pow(distance, 0.72)
              const tilt = Math.min(38 * ramp, 76) * Math.sign(offset)
              const scale = Math.max(0.68, 1 - distance * 0.105)
              const isActive = index === active
              const isPreviewed = index === detailIndex

              return (
                <button
                  key={item.title}
                  ref={index === 0 ? firstCardRef : undefined}
                  type="button"
                  className={`circular-carousel__card${isActive ? ' is-active' : ''}${isPreviewed ? ' is-previewed' : ''}`}
                  style={{
                    transform: `translateX(calc(-50% + ${offset * 74}%)) translateY(-50%) translateZ(${-ramp * 42}px) rotateY(${-tilt}deg) scale(${scale})`,
                    opacity: visible ? Math.max(0, 1 - distance * 0.2) : 0,
                    zIndex: String(100 - Math.round(distance * 10)),
                    pointerEvents: visible ? 'auto' : 'none',
                  }}
                  aria-label={`${item.title}: ${item.subtitle}`}
                  aria-current={isActive ? 'true' : undefined}
                  tabIndex={visible ? 0 : -1}
                  onClick={() => {
                    if (draggedRef.current) return
                    goTo(index)
                    setPreview(null)
                  }}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setPreview(index)
                  }}
                  onPointerLeave={() => setPreview(null)}
                  onFocus={() => setPreview(index)}
                  onBlur={() => setPreview(null)}
                >
                  <img src={item.src} alt={item.alt} draggable={false} loading="lazy" />
                  <span className="circular-carousel__shade" aria-hidden="true" />
                  <span className="circular-carousel__card-details">
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </span>
                </button>
              )
            })}
          </div>

        </>
      )}
    </section>
  )
}
