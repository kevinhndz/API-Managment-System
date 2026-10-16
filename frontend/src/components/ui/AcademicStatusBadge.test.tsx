import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AcademicStatusBadge } from './AcademicStatusBadge'

describe('AcademicStatusBadge', () => {
  it.each([
    ['APROBADA', 'Aprobada'],
    ['REPROBADA', 'Reprobada'],
    ['CANCELADA', 'Cancelada'],
    ['CERRADA', 'Cerrada'],
    ['ABIERTA', 'Abierta'],
    ['PENDIENTE', 'Pendiente'],
  ])('muestra %s como chip accesible', (status, label) => {
    render(<AcademicStatusBadge status={status} />)
    expect(screen.getByRole('status', { name: `Estado: ${label}` })).toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
