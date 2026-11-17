import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { listarActividad } from '../services/api'
import { ActividadPage } from './ActividadPage'
vi.mock('../services/api', () => ({ listarActividad: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks() })
const evento = { id: 15, usuario: 'admin', accion: 'EDITAR', modulo: 'aulas', registro_id: 71, descripcion: 'Cambio de capacidad', fecha: '2026-10-07T19:56:00Z' }

describe('ActividadPage', () => {
  it('consulta al abrir y permite filtrar sin carruseles', async () => {
    vi.mocked(listarActividad).mockResolvedValue([evento])
    render(<ActividadPage />)
    expect(await screen.findByText('Registro #71')).toBeInTheDocument()
    expect(screen.getByText('1 movimiento registrado')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por módulo' }), { target: { value: 'aulas' } })
    await waitFor(() => expect(listarActividad).toHaveBeenLastCalledWith({ modulo: 'aulas', accion: '', usuario: '', desde: '', hasta: '' }))
    fireEvent.change(screen.getByLabelText('Filtrar por acción'), { target: { value: 'EDITAR' } })
    await waitFor(() => expect(listarActividad).toHaveBeenLastCalledWith(expect.objectContaining({ accion: 'EDITAR' })))
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await waitFor(() => expect(listarActividad).toHaveBeenLastCalledWith({ modulo: '', accion: '', usuario: '', desde: '', hasta: '' }))
  })
  it('muestra vacio y errores de API sin inventar movimientos', async () => {
    vi.mocked(listarActividad).mockResolvedValue([])
    render(<ActividadPage />)
    expect(await screen.findByText('No se encontraron movimientos')).toBeInTheDocument()
    vi.mocked(listarActividad).mockRejectedValue(new Error('Sin acceso'))
    fireEvent.change(screen.getByLabelText('Filtrar por acción'), { target: { value: 'CREAR' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin acceso')
  })
  it('conserva detalle de cambios y trata texto externo como texto', async () => {
    vi.mocked(listarActividad).mockResolvedValue([{ ...evento, usuario: '<img src=x onerror=alert(1)>', datos_anteriores: { capacidad: 20 }, datos_nuevos: { capacidad: 30 } }])
    const { container } = render(<ActividadPage />)
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Ver detalle'))
    expect(screen.getByText('20 → 30')).toBeInTheDocument()
    expect(container.querySelector('img[src="x"]')).toBeNull()
  })
})
