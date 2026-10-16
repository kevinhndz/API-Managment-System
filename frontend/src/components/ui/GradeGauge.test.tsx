import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { GradeGauge } from './GradeGauge'

describe('GradeGauge', () => {
  afterEach(cleanup)
  it.each([
    [59.99, 'Reprobada', '#dc2626'],
    [60, 'Aprobada', '#d97706'],
    [69.99, 'Aprobada', '#d97706'],
    [70, 'Aprobada', '#2563eb'],
    [84.99, 'Aprobada', '#2563eb'],
    [85, 'Excelente', '#059669'],
    [100, 'Excelente', '#059669'],
  ])('colorea la nota %s según el rango acordado', (value, result, color) => {
    render(<GradeGauge label="Nota final" value={value} final />)
    expect(screen.getByRole('img', { name: new RegExp(`, ${result}$`) })).toBeInTheDocument()
    expect(document.querySelector('circle[stroke-width="3.5"]')).toHaveAttribute('stroke', color)
  })

  it('muestra nota vacía sin dibujar un indicador', () => {
    render(<GradeGauge label="Primer parcial" value={null} />)
    expect(screen.getByLabelText('Primer parcial: sin nota')).toHaveTextContent('—')
  })
})
