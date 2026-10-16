import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { listarCarreras } = vi.hoisted(() => ({ listarCarreras: vi.fn() }))
vi.mock('../services/api', () => ({ carrerasApi: { list: listarCarreras, get: vi.fn(), create: vi.fn(), update: vi.fn(), patch: vi.fn(), remove: vi.fn() } }))

import { CarrerasPage } from './CarrerasPage'

describe('CarrerasPage status chips', () => {
  afterEach(cleanup)
  beforeEach(() => listarCarreras.mockResolvedValue({ total: 2, pagina_actual: 1, limite: 10, total_paginas: 1, data: [
    { id: 1, codigo: 'SIS', nombre: 'Ingeniería en Sistemas', duracion_anios: 4, activo: true },
    { id: 2, codigo: 'ADM', nombre: 'Administración', duracion_anios: 4, activo: false },
  ] }))

  it('muestra chips con iconos para carreras activas e inactivas', async () => {
    render(<CarrerasPage />)
    expect(await screen.findByRole('status', { name: 'Estado: Activo' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Estado: Inactivo' })).toBeInTheDocument()
  })

  it('ofrece filtrar carreras por duración y estado', async () => {
    render(<CarrerasPage />)
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
    expect(await screen.findByRole('combobox', { name: 'Filtrar por duración' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por estado' })).toBeInTheDocument()
  })
})
