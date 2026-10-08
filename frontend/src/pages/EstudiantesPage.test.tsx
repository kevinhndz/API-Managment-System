import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../contexts/ThemeContext'

const { listarEstudiantes } = vi.hoisted(() => ({
  listarEstudiantes: vi.fn(),
}))

vi.mock('../services/api', () => ({
  estudiantesApi: {
    list: listarEstudiantes,
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    patch: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('../hooks/useAcademicLabels', () => ({
  useAcademicLabels: () => ({
    carreras: { 3: 'Ingeniería en Sistemas' },
    carreraOptions: [{ value: '3', label: 'Ingeniería en Sistemas' }],
  }),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Admin de prueba', email: '', role: 'Administrador' } }),
}))

import { EstudiantesPage } from './EstudiantesPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('EstudiantesPage', () => {
  beforeEach(() => {
    listarEstudiantes.mockResolvedValue({
      total: 1,
      pagina_actual: 1,
      limite: 10,
      total_paginas: 1,
      data: [{
        id: 1,
        cuenta: '2026-0001',
        nombre: 'Ana Hernández',
        correo: 'ana.hernandez@uph.edu',
        telefono: '9999-0001',
        fechaNacimiento: '2000-01-01',
        carrera_id: 3,
        estado: true,
      }],
    })
  })

  it.each([
    ['Ver carnet', 'Carnet de Ana Hernández'],
    ['Editar', 'Editar estudiante'],
    ['Eliminar', 'Eliminar estudiante'],
  ])('conserva la accion de %s desde el folder', async (action, dialogTitle) => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))

    render(<ThemeProvider><EstudiantesPage /></ThemeProvider>)
    await waitFor(() => expect(screen.getByText('2026-0001')).toBeInTheDocument())

    const trigger = screen.getByRole('button', { name: 'Acciones' })
    fireEvent.pointerEnter(trigger.closest('.folder-float')!)
    fireEvent.click(screen.getByRole('menuitem', { name: action }))

    expect(await screen.findByRole('dialog', { name: dialogTitle })).toBeInTheDocument()
  })
})
