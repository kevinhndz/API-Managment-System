import { useState } from 'react'

interface CarouselItem { src: string; alt: string; title: string; subtitle: string }

interface CircularCarouselProps {
  items: CarouselItem[]
}

export function CircularCarousel({ items }: CircularCarouselProps) {
  const [active, setActive] = useState<number | null>(null)
  const selected = active === null ? null : items[active]

  return <div className="circular-carousel">
    <div className="circular-carousel__stage" role="group" aria-label="Métricas del campus">
      {items.map((item, index) => <button
        key={item.title}
        type="button"
        className={`circular-carousel__card ${index === active ? 'is-active' : ''}`}
        onClick={() => setActive((current) => current === index ? null : index)}
        aria-expanded={index === active}
        aria-controls="detalle-metrica"
        aria-label={`Ver información de ${item.title}`}
      >
        <img src={item.src} alt={item.alt} loading="lazy" />
        <span><strong>{item.title}</strong></span>
      </button>)}
    </div>
    <div id="detalle-metrica" className={`circular-carousel__detail ${selected ? 'is-visible' : ''}`} aria-live="polite">
      {selected ? <>
        <span className="circular-carousel__count">{String((active ?? 0) + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
        <div><strong>{selected.title}</strong><p>{selected.subtitle}</p></div>
      </> : <p>Selecciona una tarjeta para ver su información.</p>}
    </div>
  </div>
}
