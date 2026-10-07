import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PersonCarnetData } from './PersonCarnetDialog'
import { PersonCarnetDialog } from './PersonCarnetDialog'

const teacherCarnet: PersonCarnetData = {
  name: 'Gabriela Pineda',
  code: 'DOC-012',
  codeLabel: 'Número de empleado',
  email: 'gabriela.pineda@uph.edu',
  status: 'Activo',
  typeLabel: 'Identificación docente',
  areaLabel: 'Vinculación institucional',
  area: 'Personal docente',
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PersonCarnetDialog', () => {
  it('adapta el carnet a datos docentes y permite cambiar de cara con teclado', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))

    render(<PersonCarnetDialog person={teacherCarnet} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Carnet de Gabriela Pineda' })).toBeInTheDocument()
    expect(screen.getAllByText('DOC-012')).toHaveLength(2)
    expect(screen.getByText('Número de empleado')).toBeInTheDocument()
    expect(screen.getByText('Identificación docente')).toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('button', { name: /carnet por el frente/i }), { key: 'Enter' })

    expect(screen.getByRole('button', { name: /carnet por el reverso/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('cierra el carnet al presionar Escape', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const onClose = vi.fn()

    render(<PersonCarnetDialog person={teacherCarnet} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
  })
})
