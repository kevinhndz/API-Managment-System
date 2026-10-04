import { useMemo, useState } from 'react'

interface CarouselItem { title: string; subtitle: string }

interface CircularCarouselProps {
  items: CarouselItem[]
  cardWidth?: number
  speed?: number
}

export function CircularCarousel({ items, cardWidth = 170, speed = 14 }: CircularCarouselProps) {
  const [active, setActive] = useState(0)
  const radius = useMemo(() => Math.max(cardWidth * 1.5, items.length * cardWidth * 0.32), [cardWidth, items.length])
  return <div className="circular-carousel" style={{ '--carousel-radius': `${radius}px`, '--carousel-speed': `${speed}s`, '--card-width': `${cardWidth}px` } as React.CSSProperties}>
    <div className="circular-carousel__stage">
      {items.map((item, index) => <button key={item.title} type="button" className={`circular-carousel__card ${index === active ? 'is-active' : ''}`} style={{ transform: `rotateY(${index * (360 / items.length)}deg) translateZ(var(--carousel-radius))` }} onClick={() => setActive(index)} aria-label={`Ver ${item.title}`}>
        <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
      </button>)}
    </div>
    <div className="circular-carousel__caption"><span>{String(active + 1).padStart(2, '0')}</span><strong>{items[active]?.title}</strong><small>{items[active]?.subtitle}</small></div>
  </div>
}
