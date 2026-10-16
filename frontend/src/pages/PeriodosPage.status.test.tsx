import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listarPeriodos } = vi.hoisted(() => ({ listarPeriodos: vi.fn() }))
vi.mock('../services/api', () => ({ periodosApi: { list: listarPeriodos, get: vi.fn(), create: vi.fn(), update: vi.fn(), patch: vi.fn(), remove: vi.fn() } }))

import { PeriodosPage } from './PeriodosPage'

describe('PeriodosPage status chips', () => {
  beforeEach(() => listarPeriodos.mockResolvedValue({ total: 2, pagina_actual: 1, limite: 10, total_paginas: 1, data: [
    { id: 1, anio: 2026, numero: 1, fecha_inicio: '2026-01-01', fecha_fin: '2026-05-31', activo: true },
    { id: 2, anio: 2025, numero: 2, fecha_inicio: '2025-06-01', fecha_fin: '2025-10-31', activo: false },
  ] }))

  it('muestra chips con iconos para periodos activos e inactivos', async () => {
    render(<PeriodosPage />)
    expect(await screen.findByRole('status', { name: 'Estado: Activo' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Estado: Inactivo' })).toBeInTheDocument()
  })

  it('ofrece filtrar los periodos por número y estado', async () => {
    render(<PeriodosPage />)
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
    expect(await screen.findByRole('combobox', { name: 'Filtrar por número de periodo' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por estado' })).toBeInTheDocument()
  })
})
