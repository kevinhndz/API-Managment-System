import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
  it('muestra cifras reales y distribuciones accesibles', () => {
    render(<DashboardIndicators {...base} />)

    expect(screen.getByLabelText('98')).toBeInTheDocument()
    expect(screen.getByLabelText('83,5/100')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Secciones abiertas: Abiertas 99, Cerradas 1/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Matrículas activas: Activas 100, Canceladas 0/ })).toBeInTheDocument()
  })

  it('no inventa un promedio cuando faltan notas', () => {
    render(<DashboardIndicators {...base} averageGrade={null} gradedCount={0} />)

    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('NaN')).not.toBeInTheDocument()
  })
})
