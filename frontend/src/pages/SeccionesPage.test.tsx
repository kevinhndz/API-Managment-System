import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listarSecciones } = vi.hoisted(() => ({ listarSecciones: vi.fn() }))
vi.mock('../services/api', () => ({ seccionesApi: { list: listarSecciones, get: vi.fn(), create: vi.fn(), update: vi.fn(), patch: vi.fn(), remove: vi.fn() } }))
vi.mock('../hooks/useAcademicLabels', () => ({ useAcademicLabels: () => ({
  asignaturas: { 1: 'Programación' }, docentes: { 2: 'Ana López' }, periodos: { 3: '2026 · periodo 1' },
  asignaturaOptions: [{ value: '1', label: 'Programación' }], docenteOptions: [{ value: '2', label: 'DOC-02 · Ana López' }],
  periodoOptions: [{ value: '3', label: '2026 · periodo 1' }], aulaOptions: [{ value: '4', label: 'A-104' }],
}) }))

import { SeccionesPage } from './SeccionesPage'

describe('SeccionesPage', () => {
  beforeEach(() => listarSecciones.mockResolvedValue({ total: 1, pagina_actual: 1, limite: 10, total_paginas: 1, data: [
    { id: 5, codigo: 'SEC-05', asignatura_id: 1, docente_id: 2, periodo_id: 3, aula_id: 4, dias: 'LUN-MIE', hora_inicio: '08:00', hora_fin: '10:00', cupo_maximo: 30, estado: 'CERRADA' },
  ] }))

  it('colorea el estado y muestra filtros de asignación académica', async () => {
    render(<SeccionesPage />)
    expect(await screen.findByRole('status', { name: 'Estado: Cerrada' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
    expect(screen.getByRole('combobox', { name: 'Filtrar por estado' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por docente' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por periodo' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por aula' })).toBeInTheDocument()
  })
})
