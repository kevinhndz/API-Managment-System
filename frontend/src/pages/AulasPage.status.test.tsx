import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { listarAulas } = vi.hoisted(() => ({ listarAulas: vi.fn() }))
vi.mock('../services/api', () => ({ aulasApi: { list: listarAulas, get: vi.fn(), create: vi.fn(), update: vi.fn(), patch: vi.fn(), remove: vi.fn() } }))

import { AulasPage } from './AulasPage'

describe('AulasPage status chips', () => {
  afterEach(cleanup)
  beforeEach(() => listarAulas.mockResolvedValue({ total: 2, pagina_actual: 1, limite: 10, total_paginas: 1, data: [
    { id: 1, codigo: 'A-101', edificio: 'Norte', capacidad: 30, activo: true },
    { id: 2, codigo: 'B-205', edificio: 'Sur', capacidad: 25, activo: false },
  ] }))

  it('muestra chips con iconos para aulas activas e inactivas', async () => {
    render(<AulasPage />)
    expect(await screen.findByRole('status', { name: 'Estado: Activo' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Estado: Inactivo' })).toBeInTheDocument()
  })

  it('ofrece filtros por edificio y capacidad desde el botón de embudo', async () => {
    render(<AulasPage />)
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
    expect(await screen.findByRole('combobox', { name: 'Filtrar por edificio' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por capacidad' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por estado' })).toBeInTheDocument()
  })
})
