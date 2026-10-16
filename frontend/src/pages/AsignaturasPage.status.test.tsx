import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listarAsignaturas } = vi.hoisted(() => ({ listarAsignaturas: vi.fn() }))
vi.mock('../services/api', () => ({ asignaturasApi: { list: listarAsignaturas, get: vi.fn(), create: vi.fn(), update: vi.fn(), patch: vi.fn(), remove: vi.fn() } }))
vi.mock('../hooks/useAcademicLabels', () => ({ useAcademicLabels: () => ({ carreras: { 1: 'Ingeniería en Sistemas' }, carreraOptions: [], asignaturaOptions: [] }) }))

import { AsignaturasPage } from './AsignaturasPage'

describe('AsignaturasPage status chips', () => {
  beforeEach(() => listarAsignaturas.mockResolvedValue({ total: 2, pagina_actual: 1, limite: 10, total_paginas: 1, data: [
    { id: 1, codigo: 'SIS-101', nombre: 'Programación', unidades_valorativas: 4, carrera_id: 1, requisito_id: null, activo: true },
    { id: 2, codigo: 'SIS-201', nombre: 'Bases de datos', unidades_valorativas: 4, carrera_id: 1, requisito_id: 1, activo: false },
  ] }))

  it('muestra chips con iconos para asignaturas activas e inactivas', async () => {
    render(<AsignaturasPage />)
    expect(await screen.findByRole('status', { name: 'Estado: Activo' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Estado: Inactivo' })).toBeInTheDocument()
  })

  it('ofrece filtros por carrera, unidades y estado', async () => {
    render(<AsignaturasPage />)
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
    expect(await screen.findByRole('combobox', { name: 'Filtrar por carrera' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por unidades' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por estado' })).toBeInTheDocument()
  })
})
