import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Estudiante } from '../../types/api'
import { StudentCarnetDialog } from './StudentCarnetDialog'

const student: Estudiante = {
  id: 12,
  cuenta: '2026-0012',
  nombre: 'Gabriela Pineda',
  correo: 'gabriela.pineda@uph.edu',
  telefono: '9999-1212',
  fechaNacimiento: '2004-02-12',
  carrera_id: 3,
  estado: true,
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('StudentCarnetDialog', () => {
  it('presenta el carnet del estudiante y permite cerrarlo con Escape', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const onClose = vi.fn()

    render(<StudentCarnetDialog student={student} careerName="Ingeniería en Sistemas" onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: 'Carnet de Gabriela Pineda' })).toBeInTheDocument()
    expect(screen.getAllByText('2026-0012')).toHaveLength(2)
    expect(screen.getAllByText('Ingeniería en Sistemas')).toHaveLength(2)

    fireEvent.keyDown(screen.getByRole('button', { name: /carnet por el frente/i }), { key: 'Enter' })
    expect(screen.getByRole('button', { name: /carnet por el reverso/i })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
  })
})
