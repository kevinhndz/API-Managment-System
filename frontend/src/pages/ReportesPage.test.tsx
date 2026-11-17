import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { descargarDocumento, descargarReporte, previsualizarReporte } from '../services/api'
import { ReportesPage } from './ReportesPage'

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { role: 'Administrador' } }) }))
vi.mock('../hooks/useAcademicLabels', () => ({ useAcademicLabels: () => ({ carreraOptions: [{ value: '8', label: 'ING · Ingeniería' }], periodoOptions: [], estudianteOptions: [{ value: '17', label: '20260017 · Ana López' }], docenteOptions: [{ value: '7', label: 'DOC-007 · Carlos Perez' }], asignaturaOptions: [] }) }))
vi.mock('../services/api', () => ({ descargarReporte: vi.fn().mockResolvedValue(undefined), obtenerCargaDocente: vi.fn().mockResolvedValue([]), descargarDocumento: vi.fn().mockResolvedValue(undefined), previsualizarReporte: vi.fn(), previsualizarHistorial: vi.fn(), previsualizarDocumento: vi.fn(), subirLogoInstitucional: vi.fn(), urlLogoInstitucional: vi.fn(() => '/api/documentos/logo'), INSTITUTION_SLUG: 'uphn', obtenerSlugInstitucion: () => 'universidad-elegida' }))

class WorkerPrueba {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() { workers.push(this) }
}
let workers: WorkerPrueba[] = []
beforeEach(() => { workers = []; vi.stubGlobal('Worker', WorkerPrueba) })
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })
function elegir(modulo: string) { fireEvent.change(screen.getByRole('combobox', { name: 'Tipo de reporte' }), { target: { value: modulo } }) }
function responder(datos = { modulo: 'estudiantes', total_registros: 99, columnas: [{ titulo: 'Nombre', campo: 'nombre' }], registros: [{ nombre: 'Ana López' }] }) {
  const worker = workers.at(-1)!
  const { id } = worker.postMessage.mock.calls.at(-1)![0]
  act(() => worker.onmessage?.({ data: { id, estado: 'completada', datos } } as MessageEvent))
}
function consultar() { fireEvent.click(screen.getByRole('button', { name: 'Consultar datos' })); responder() }

describe('ReportesPage', () => {
  it('abre con selector y no consulta hasta pulsar Consultar datos', () => {
    render(<ReportesPage />)
    expect(screen.getByRole('combobox', { name: 'Tipo de reporte' })).toHaveValue('estudiantes')
    expect(workers).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeDisabled()
    consultar()
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(workers[0].postMessage).toHaveBeenCalledWith(expect.objectContaining({ institucion: 'universidad-elegida' }))
  })
  it.each(['xlsx', 'pdf', 'csv', 'json'])('confirma exportacion %s con todos los registros y los filtros consultados', async (formato) => {
    render(<ReportesPage />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Carrera' }), { target: { value: 'Ingeniería' } })
    fireEvent.click(screen.getByRole('option', { name: 'ING · Ingeniería' }))
    consultar()
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))
    expect(screen.getByRole('dialog', { name: 'Vista previa de exportación' })).toHaveTextContent('99 registros')
    expect(descargarReporte).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Formato de exportación'), { target: { value: formato } })
    fireEvent.click(screen.getByRole('button', { name: `Descargar reporte (.${formato})` }))
    await waitFor(() => expect(descargarReporte).toHaveBeenCalledWith('estudiantes', formato, { carrera_id: 8 }))
  })
  it('conserva vista del contenido sin descargar al abrirla', async () => {
    vi.mocked(previsualizarReporte).mockResolvedValue(new Blob(['Nombre\nAna López'], { type: 'text/csv' }))
    render(<ReportesPage />); consultar()
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))
    fireEvent.change(screen.getByLabelText('Formato de exportación'), { target: { value: 'csv' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ver contenido' }))
    expect(await screen.findByRole('dialog', { name: 'Vista previa de Estudiantes' })).toBeInTheDocument()
    expect(previsualizarReporte).toHaveBeenCalledWith('estudiantes', 'csv', {})
    expect(descargarReporte).not.toHaveBeenCalled()
  })
  it.each([['historial_academico', 'Estudiante', '20260017', '20260017 · Ana López', 'historial-academico', 17], ['constancia_laboral', 'Docente', 'DOC-007', 'DOC-007 · Carlos Perez', 'constancia-laboral', 7]])('conserva emision del documento %s', async (modulo, campo, busqueda, opcion, tipo, id) => {
    render(<ReportesPage />); elegir(String(modulo))
    fireEvent.change(screen.getByRole('combobox', { name: String(campo) }), { target: { value: busqueda } })
    fireEvent.click(screen.getByRole('option', { name: String(opcion) }))
    fireEvent.click(screen.getByRole('button', { name: 'Preparar documento PDF' }))
    fireEvent.click(screen.getByRole('button', { name: 'Descargar reporte (.pdf)' }))
    await waitFor(() => expect(descargarDocumento).toHaveBeenCalledWith(tipo, id))
  })
  it('descarta respuestas antiguas al cambiar filtros y comunica errores del hilo', async () => {
    render(<ReportesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Consultar datos' }))
    const worker = workers[0]
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    act(() => worker.onmessage?.({ data: { id: 1, estado: 'completada', datos: { total_registros: 1, columnas: [], registros: [] } } } as MessageEvent))
    expect(screen.getByText('Consulta los datos del reporte')).toBeInTheDocument()
    expect(worker.terminate).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Consultar datos' }))
    const next = workers.at(-1)!; const { id } = next.postMessage.mock.calls[0][0]
    act(() => next.onmessage?.({ data: { id, estado: 'error', codigo: 503, mensaje: 'Servicio no disponible' } } as MessageEvent))
    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible')
  })
})
