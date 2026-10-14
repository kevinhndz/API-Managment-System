import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { listarActividad } from '../services/api'
import { ActividadPage } from './ActividadPage'

vi.mock('../services/api', () => ({
  listarActividad: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ActividadPage', () => {
  it('espera a que se elija un módulo antes de mostrar actividades y sus filtros', async () => {
    const user = userEvent.setup()
    vi.mocked(listarActividad).mockResolvedValue([{
      id: 15,
      usuario: 'admin',
      accion: 'CREAR',
      modulo: 'aulas',
      registro_id: 4,
      descripcion: 'Creó el aula 4',
      fecha: '2026-10-14T12:00:00Z',
    }])

    render(<ActividadPage />)

    expect(screen.getByText('Elige un módulo para ver sus movimientos')).toBeInTheDocument()
    expect(screen.queryByText('Movimientos de todos los módulos')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Filtrar por acción')).not.toBeInTheDocument()
    expect(listarActividad).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Aulas: Cambios y registros' }))

    expect(await screen.findByRole('heading', { name: 'Actividad de Aulas' })).toBeInTheDocument()
    expect(await screen.findByText(/Creó el aula 4/)).toBeInTheDocument()
    expect(screen.getByLabelText('Filtrar por acción')).toBeInTheDocument()
    await waitFor(() => expect(listarActividad).toHaveBeenCalledWith({
      modulo: 'aulas',
      accion: '',
      usuario: '',
      desde: '',
      hasta: '',
    }))
  })
})
