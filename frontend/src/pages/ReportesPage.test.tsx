import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { descargarReporte } from '../services/api'
import { ReportesPage } from './ReportesPage'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Administrador' } }),
}))

vi.mock('../hooks/useAcademicLabels', () => ({
  useAcademicLabels: () => ({
    carreraOptions: [{ value: '8', label: 'ING · Ingeniería' }, { value: '9', label: 'ADM · Administración' }],
    periodoOptions: [{ value: '2', label: '2026 · período 2' }],
    estudianteOptions: [{ value: '17', label: '20260017 · Ana López' }, { value: '18', label: '20260018 · Luis Díaz' }],
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

    expect(screen.queryByRole('combobox', { name: 'Módulo' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Matrículas: abrir reporte académico' }))
    expect(screen.getByRole('button', { name: 'Descargar Excel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar PDF' })).toBeInTheDocument()
    const csvButton = screen.getByRole('button', { name: 'Descargar CSV' })
    expect(csvButton).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar JSON' })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Carrera' }), { target: { value: 'Ingeniería' } })
    expect(screen.getByRole('option', { name: 'ING · Ingeniería' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'ING · Ingeniería' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Estudiante' }), { target: { value: '20260017' } })
    expect(screen.getByRole('option', { name: '20260017 · Ana López' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: '20260017 · Ana López' }))

    fireEvent.click(csvButton)

    await waitFor(() => {
      expect(descargarReporte).toHaveBeenCalledWith('matriculas', 'csv', { carrera_id: 8, estudiante_id: 17 })
    })
  })

  it('abre el reporte elegido y permite regresar a la cuadrícula', () => {
    render(<ReportesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Estudiantes: abrir reporte académico' }))
    expect(screen.getByRole('heading', { name: 'Estudiantes' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Módulo' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Elegir otro reporte' }))
    expect(screen.getByRole('button', { name: 'Matrículas: abrir reporte académico' })).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: 'Matrículas: abrir reporte académico' }))
    fireEvent.click(screen.getByRole('button', { name: 'Consultar vista previa' }))
    expect(screen.getByRole('status')).toHaveTextContent('Consultando en segundo plano')
    expect(trabajadores[0].postMessage).toHaveBeenCalledWith({ id: 2, modulo: 'matriculas', filtros: {} })

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar consulta' }))
    trabajadores[0].onmessage?.({ data: { id: 2, estado: 'completada', datos: { total_registros: 1, columnas: [], registros: [] } } } as MessageEvent)
    expect(screen.getByRole('status')).toHaveTextContent('Consultando en segundo plano')

    trabajadores[0].onmessage?.({ data: { id: 3, estado: 'completada', datos: {
      modulo: 'matriculas', total_registros: 1, columnas: [{ titulo: 'Estudiante', campo: 'estudiante' }], registros: [{ estudiante: 'Ana López' }],
    } } } as MessageEvent)
    expect(await screen.findByText('Ana López')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Elegir otro reporte' }))
    expect(trabajadores[0].terminate).toHaveBeenCalled()
    expect(screen.queryByText('Ana López')).not.toBeInTheDocument()
  })

  it('muestra los campos booleanos de los reportes con el chip de activo e inactivo', async () => {
    const trabajadores: Array<{ onmessage: ((event: MessageEvent) => void) | null; postMessage: ReturnType<typeof vi.fn>; terminate: ReturnType<typeof vi.fn> }> = []
    class TrabajadorDePrueba {
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: (() => void) | null = null
      postMessage = vi.fn()
      terminate = vi.fn()
      constructor() { trabajadores.push(this) }
    }
    vi.stubGlobal('Worker', TrabajadorDePrueba)

    render(<ReportesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Estudiantes: abrir reporte académico' }))
    fireEvent.click(screen.getByRole('button', { name: 'Consultar vista previa' }))
    trabajadores[0].onmessage?.({ data: { id: 2, estado: 'completada', datos: {
      modulo: 'estudiantes', total_registros: 1,
      columnas: [{ titulo: 'Estado', campo: 'estado' }], registros: [{ estado: false }],
    } } } as MessageEvent)

    expect(await screen.findByRole('status', { name: 'Estado: Inactivo' })).toBeInTheDocument()
  })

  it('muestra estados de matrícula como chips en la vista previa', async () => {
    const trabajadores: Array<{ onmessage: ((event: MessageEvent) => void) | null; postMessage: ReturnType<typeof vi.fn>; terminate: ReturnType<typeof vi.fn> }> = []
    class TrabajadorDePrueba {
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: (() => void) | null = null
      postMessage = vi.fn()
      terminate = vi.fn()
      constructor() { trabajadores.push(this) }
    }
    vi.stubGlobal('Worker', TrabajadorDePrueba)

    render(<ReportesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Matrículas: abrir reporte académico' }))
    fireEvent.click(screen.getByRole('button', { name: 'Consultar vista previa' }))
    trabajadores[0].onmessage?.({ data: { id: 2, estado: 'completada', datos: {
      modulo: 'matriculas', total_registros: 1,
      columnas: [{ titulo: 'Estado', campo: 'estado' }], registros: [{ estado: 'REPROBADA' }],
    } } } as MessageEvent)

    expect(await screen.findByRole('status', { name: 'Estado: Reprobada' })).toBeInTheDocument()
  })
})
