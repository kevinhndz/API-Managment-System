import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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

    render(
      <MemoryRouter initialEntries={['/login']}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
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
    render(<MemoryRouter initialEntries={['/login']}><ThemeProvider><AuthProvider><App /></AuthProvider></ThemeProvider></MemoryRouter>)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Usuario'), 'usuario-prueba')
    await user.type(screen.getByLabelText('Contraseña'), 'clave-de-prueba-2026')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('link', { name: 'Estudiantes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Calificaciones' })).toBeInTheDocument()
  })
})
