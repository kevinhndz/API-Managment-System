import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listarDocentes } = vi.hoisted(() => ({
  listarDocentes: vi.fn(),
}))

vi.mock('../services/api', () => ({
  docentesApi: {
    list: listarDocentes,
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    patch: vi.fn(),
    remove: vi.fn(),
  },
}))

import { DocentesPage } from './DocentesPage'

describe('DocentesPage', () => {
  beforeEach(() => {
    listarDocentes.mockResolvedValue({
      total: 1,
      pagina_actual: 1,
      limite: 10,
      total_paginas: 1,
      data: [{
        id: 12,
        numero_empleado: 'DOC-012',
        nombres: 'Gabriela',
        apellidos: 'Pineda',
        correo: 'gabriela.pineda@uph.edu',
        estado: true,
      }],
    })
  })

  it('abre el carnet desde acciones y presenta la identificacion docente', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))

    render(<DocentesPage />)

    await waitFor(() => expect(screen.getByText('DOC-012')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /acciones/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /ver carnet/i }))

    const carnet = screen.getByRole('dialog', { name: 'Carnet de Gabriela Pineda' })
    expect(carnet).toHaveTextContent('DOC-012')
    expect(carnet).toHaveTextContent('gabriela.pineda@uph.edu')
    expect(carnet).toHaveTextContent('Identificación docente')
  })
})
