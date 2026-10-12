import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  afterEach(() => vi.clearAllMocks())

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
})
