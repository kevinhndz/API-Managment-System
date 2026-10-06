import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

describe('flujo principal', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('inicia sesión y navega al CRUD de aulas', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ total: 0, pagina_actual: 1, limite: 100, total_paginas: 0, data: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
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

    await user.type(screen.getByLabelText('Usuario'), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'Campus2026')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await user.click(await screen.findByRole('link', { name: 'Aulas' }))
    expect(
      await screen.findByText('Gestiona espacios, capacidad y disponibilidad del campus.', {}, { timeout: 15_000 }),
    ).toBeInTheDocument()
  })

  it('muestra los nuevos módulos en la navegación', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ total: 0, pagina_actual: 1, limite: 100, total_paginas: 0, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    render(<MemoryRouter initialEntries={['/login']}><ThemeProvider><AuthProvider><App /></AuthProvider></ThemeProvider></MemoryRouter>)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Usuario'), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'Campus2026')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('link', { name: 'Estudiantes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Calificaciones' })).toBeInTheDocument()
  })
})
