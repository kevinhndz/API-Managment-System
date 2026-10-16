import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listarMatriculas } = vi.hoisted(() => ({ listarMatriculas: vi.fn() }))

vi.mock('../services/api', () => ({
  matriculasApi: { list: listarMatriculas, get: vi.fn(), create: vi.fn(), update: vi.fn(), patch: vi.fn(), remove: vi.fn() },
}))

vi.mock('../hooks/useAcademicLabels', () => ({
  useAcademicLabels: () => ({ estudiantes: { 1: 'Ana Hernández', 2: 'Luis Díaz' }, secciones: { 1: 'A-101', 2: 'B-204' }, estudianteOptions: [], seccionOptions: [] }),
}))

import { MatriculasPage } from './MatriculasPage'

describe('MatriculasPage', () => {
  beforeEach(() => {
    listarMatriculas.mockResolvedValue({
      total: 2, pagina_actual: 1, limite: 10, total_paginas: 1,
      data: [
        { id: 1, estudiante_id: 1, seccion_id: 1, fecha_matricula: '2026-01-10', estado: 'ACTIVA' },
        { id: 2, estudiante_id: 2, seccion_id: 2, fecha_matricula: '2026-01-11', estado: 'CANCELADA' },
      ],
    })
  })

  it('aplica el chip solo a la matrícula ACTIVA y conserva los otros estados', async () => {
    render(<MatriculasPage />)

    expect(await screen.findByRole('status', { name: 'Estado: Activa' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('CANCELADA')).toBeInTheDocument())
    expect(screen.queryByRole('status', { name: 'Estado: Inactivo' })).not.toBeInTheDocument()
  })
})
