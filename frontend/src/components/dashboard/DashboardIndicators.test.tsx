import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DashboardIndicators } from './DashboardIndicators'

const base = { activeStudents: 98, totalStudents: 100, activeEnrollments: 75, periodLabel: 'Período 2026-3', averageGrade: 83.5, gradedCount: 6, occupiedOpenSeats: 10, openSectionCapacity: 40 }
afterEach(cleanup)
describe('DashboardIndicators', () => {
  it('presenta valores de la API y calcula la ocupacion con los cupos reales', () => {
    render(<DashboardIndicators {...base} />)
    const metrics = screen.getByRole('region', { name: 'Indicadores académicos' })
    expect(within(metrics).getByText('98')).toBeInTheDocument()
    expect(within(metrics).getByText('75')).toBeInTheDocument()
    expect(metrics).toHaveTextContent('83.5')
    expect(metrics).toHaveTextContent('25.0%')
    expect(metrics).toHaveTextContent('6 notas')
    expect(metrics).toHaveTextContent('Período 2026-3')
  })
  it('no inventa promedio ni ocupacion si faltan datos', () => {
    const { container } = render(<DashboardIndicators {...base} averageGrade={null} gradedCount={0} openSectionCapacity={0} />)
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(container).not.toHaveTextContent('NaN')
    expect(container).not.toHaveTextContent('Infinity')
  })
})
