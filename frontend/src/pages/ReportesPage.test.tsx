import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { descargarReporte } from '../services/api'
import { ReportesPage } from './ReportesPage'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Administrador' } }),
}))

vi.mock('../hooks/useAcademicLabels', () => ({
  useAcademicLabels: () => ({
    carreraOptions: [],
    periodoOptions: [],
    estudianteOptions: [],
  }),
}))

vi.mock('../services/api', () => ({
  descargarReporte: vi.fn(),
}))

describe('ReportesPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('ofrece Excel, PDF, CSV y JSON y solicita la descarga seleccionada', async () => {
    vi.mocked(descargarReporte).mockResolvedValue(undefined)
    render(<ReportesPage />)

    expect(screen.getByRole('button', { name: 'Descargar Excel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar PDF' })).toBeInTheDocument()
    const csvButton = screen.getByRole('button', { name: 'Descargar CSV' })
    expect(csvButton).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar JSON' })).toBeInTheDocument()

    fireEvent.click(csvButton)

    await waitFor(() => {
      expect(descargarReporte).toHaveBeenCalledWith('matriculas', 'csv', {})
    })
  })

  it('mantiene los filtros activos y descarta respuestas antiguas del hilo', async () => {
    const trabajadores: Array<{
      onmessage: ((event: MessageEvent) => void) | null
      postMessage: ReturnType<typeof vi.fn>
      terminate: ReturnType<typeof vi.fn>
    }> = []

    class TrabajadorDePrueba {
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: (() => void) | null = null
      postMessage = vi.fn()
      terminate = vi.fn()

      constructor() {
        trabajadores.push(this)
      }
    }

    vi.stubGlobal('Worker', TrabajadorDePrueba)
    render(<ReportesPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Consultar vista previa' }))
    expect(screen.getByRole('status')).toHaveTextContent('Consultando en segundo plano')
    expect(screen.getByRole('combobox', { name: 'Módulo' })).toBeEnabled()
    expect(trabajadores[0].postMessage).toHaveBeenCalledWith({ id: 1, modulo: 'matriculas', filtros: {} })

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar consulta' }))
    trabajadores[0].onmessage?.({ data: { id: 1, estado: 'completada', datos: { total_registros: 1, columnas: [], registros: [] } } } as MessageEvent)
    expect(screen.getByRole('status')).toHaveTextContent('Consultando en segundo plano')

    trabajadores[0].onmessage?.({ data: { id: 2, estado: 'completada', datos: {
      modulo: 'matriculas', total_registros: 1, columnas: [{ titulo: 'Estudiante', campo: 'estudiante' }], registros: [{ estudiante: 'Ana López' }],
    } } } as MessageEvent)
    expect(await screen.findByText('Ana López')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Módulo' }), { target: { value: 'estudiantes' } })
    expect(trabajadores[0].terminate).toHaveBeenCalled()
    expect(screen.queryByText('Ana López')).not.toBeInTheDocument()
  })
})
