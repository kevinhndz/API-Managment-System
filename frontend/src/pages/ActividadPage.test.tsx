import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

    expect(screen.getByText('¿Qué parte del campus quieres revisar?')).toBeInTheDocument()
    expect(screen.queryByText('Movimientos de todos los módulos')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Filtrar por acción')).not.toBeInTheDocument()
    expect(listarActividad).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Aulas: Cambios y registros' }))

    expect(await screen.findByRole('heading', { name: 'Actividad de Aulas' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Album de metricas del campus' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elegir otro módulo' })).toBeInTheDocument()
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

  it('ignora el cursor inmóvil y abre el módulo tras un hover intencional', async () => {
    const user = userEvent.setup()
    vi.mocked(listarActividad).mockResolvedValue([])
    render(<ActividadPage />)

    const docentes = screen.getByRole('button', { name: 'Docentes: Cambios y registros' })
    fireEvent.pointerEnter(docentes, { pointerType: 'mouse' })
    fireEvent.pointerMove(docentes, { pointerType: 'mouse', movementX: 0, movementY: 0 })

    expect(screen.getByText('¿Qué parte del campus quieres revisar?')).toBeInTheDocument()
    expect(listarActividad).not.toHaveBeenCalled()

    fireEvent.pointerMove(docentes, { pointerType: 'mouse', movementX: 8, movementY: 2 })

    expect(await screen.findByRole('heading', { name: 'Actividad de Docentes' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Album de metricas del campus' })).not.toBeInTheDocument()
    await waitFor(() => expect(listarActividad).toHaveBeenCalledWith({
      modulo: 'docentes',
      accion: '',
      usuario: '',
      desde: '',
      hasta: '',
    }))

    await user.click(screen.getByRole('button', { name: 'Elegir otro módulo' }))
    expect(screen.getByText('¿Qué parte del campus quieres revisar?')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Album de metricas del campus' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Actividad de Docentes' })).not.toBeInTheDocument()
  })

  it('muestra entradas del usuario como texto y no como etiquetas HTML', async () => {
    const usuario = '<img src=x onerror=alert(1)>'
    const descripcion = '<svg onload=alert(1)>'
    vi.mocked(listarActividad).mockResolvedValue([{
      id: 16,
      usuario,
      accion: 'CREAR',
      modulo: 'aulas',
      registro_id: null,
      descripcion,
      fecha: '2026-10-14T12:00:00Z',
    }])

    const { container } = render(<ActividadPage />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Aulas: Cambios y registros' }))

    await screen.findByRole('heading', { name: 'Actividad de Aulas' })
    const textos = Array.from(container.querySelectorAll('p')).map((parrafo) => parrafo.textContent ?? '')

    expect(textos.some((texto) => texto.includes(usuario))).toBe(true)
    expect(textos.some((texto) => texto.includes(descripcion))).toBe(true)
    expect(container.querySelector('img[src="x"]')).toBeNull()
  })
})
