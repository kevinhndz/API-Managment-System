import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { listarMatriculas } = vi.hoisted(() => ({ listarMatriculas: vi.fn() }))

vi.mock('../services/api', () => ({
  matriculasApi: { list: listarMatriculas, get: vi.fn(), create: vi.fn(), update: vi.fn(), patch: vi.fn(), remove: vi.fn() },
}))

vi.mock('../hooks/useAcademicLabels', () => ({
  useAcademicLabels: () => ({ estudiantes: { 1: 'Ana Hernández', 2: 'Luis Díaz' }, secciones: { 1: 'A-101', 2: 'B-204' }, estudianteOptions: [], seccionOptions: [] }),
}))

import { MatriculasPage } from './MatriculasPage'

describe('MatriculasPage', () => {
  afterEach(cleanup)
  beforeEach(() => {
    listarMatriculas.mockResolvedValue({
      total: 2, pagina_actual: 1, limite: 10, total_paginas: 1,
      data: [
        { id: 1, estudiante_id: 1, seccion_id: 1, fecha_matricula: '2026-01-10', estado: 'ACTIVA' },
        { id: 2, estudiante_id: 2, seccion_id: 2, fecha_matricula: '2026-01-11', estado: 'CANCELADA' },
      ],
    })
  })

  it('muestra chips con texto e iconos apropiados para los estados de matrícula', async () => {
    render(<MatriculasPage />)

    expect(await screen.findByRole('status', { name: 'Estado: Activa' })).toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Estado: Cancelada' })).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Estado: Inactivo' })).not.toBeInTheDocument()
  })

  it('permite filtrar las matrículas por sección y estado', async () => {
    render(<MatriculasPage />)
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
    expect(await screen.findByRole('combobox', { name: 'Filtrar por sección' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por estado' })).toBeInTheDocument()
  })
})
