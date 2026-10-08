import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DashboardIndicators } from './DashboardIndicators'

const base = {
  activeStudents: 98,
  totalStudents: 100,
  sectionCounts: [{ label: 'Abiertas', value: 99 }, { label: 'Cerradas', value: 1 }],
  enrollmentCounts: [{ label: 'Activas', value: 100 }, { label: 'Canceladas', value: 0 }],
  gradeCounts: [{ label: '0–59', value: 1 }, { label: '60–79', value: 2 }, { label: '80–100', value: 3 }],
  averageGrade: 83.5,
  gradedCount: 6,
}

describe('DashboardIndicators', () => {
  afterEach(() => cleanup())

  it('muestra cifras reales y distribuciones accesibles', () => {
    const { container } = render(<DashboardIndicators {...base} />)

    expect(container.querySelector('.metric-number[aria-label="98"]')).toBeInTheDocument()
    expect(container.querySelector('.berry-mini-metric .text-lg')).toHaveTextContent('83.5')
    expect(container.querySelector('.metric-number[aria-label="100"]')).toBeInTheDocument()
    expect(container).toHaveTextContent('99 secciones abiertas')
    expect(container).toHaveTextContent('6 notas')
  })

  it('no inventa un promedio cuando faltan notas', () => {
    const { container } = render(<DashboardIndicators {...base} averageGrade={null} gradedCount={0} />)

    expect(container.querySelector('.berry-mini-metric .text-lg')).toHaveTextContent('—')
    expect(container).not.toHaveTextContent('NaN')
  })
})
