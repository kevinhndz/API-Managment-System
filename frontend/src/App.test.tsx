import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

function prepararApiDePrueba() {
  let consultasDeSesion = 0
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, _init) => {
    const url = String(input)
    if (url.endsWith('/login/actual')) {
      consultasDeSesion += 1
      if (consultasDeSesion === 1) {
        return new Response(JSON.stringify({ detail: 'Sin sesion' }), { status: 401 })
      }
      return new Response(JSON.stringify({ usuario: 'usuario-prueba', correo: null, rol: 'Administrador' }), { status: 200 })
    }
    if (url.endsWith('/login/sesion')) {
      return new Response(JSON.stringify({ autenticada: true }), { status: 200 })
    }
    if (url.endsWith('/dashboard/resumen')) {
      return new Response(JSON.stringify({
        anio: 2026,
        periodo: null,
        estudiantes: { total: 0, activos: 0 },
        docentes: { activos: 0 },
        carreras: { activas: 0 },
        aulas: { total: 0, activas: 0, capacidad_total: 0 },
        aulas_mayor_capacidad: [],
        edificios: [],
        secciones: { total: 0, abiertas: 0, cerradas: 0, canceladas: 0, otros_estados: 0 },
        matriculas: { activas: 0, tendencia: Array.from({ length: 12 }, (_, index) => ({ mes: index + 1, activas: 0, canceladas: 0, finalizadas: 0 })) },
        calificaciones: { cantidad: 0, promedio: null },
        cupos_ocupados: 0,
        capacidad_secciones_abiertas: 0,
        asignaturas_total: 0,
        periodos_total: 0,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ total: 0, pagina_actual: 1, limite: 100, total_paginas: 0, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
}

describe('flujo principal', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('inicia sesión y navega al CRUD de aulas', async () => {
    prepararApiDePrueba()
    const user = userEvent.setup()

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <MemoryRouter initialEntries={['/login']}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Usuario'), 'usuario-prueba')
    await user.type(screen.getByLabelText('Contraseña'), 'clave-de-prueba-2026')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    const enlaceAulas = await screen.findByRole('link', { name: 'Aulas' }, { timeout: 15_000 })
    await user.click(enlaceAulas)
    expect(
      await screen.findByText('Gestiona espacios, capacidad y disponibilidad del campus.', {}, { timeout: 15_000 }),
    ).toBeInTheDocument()
  })

  it('muestra los nuevos módulos en la navegación', async () => {
    prepararApiDePrueba()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<MemoryRouter initialEntries={['/login']}><QueryClientProvider client={queryClient}><ThemeProvider><AuthProvider><App /></AuthProvider></ThemeProvider></QueryClientProvider></MemoryRouter>)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Usuario'), 'usuario-prueba')
    await user.type(screen.getByLabelText('Contraseña'), 'clave-de-prueba-2026')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('link', { name: 'Estudiantes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Calificaciones' })).toBeInTheDocument()
  })
})
