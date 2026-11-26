import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { ConfiguracionPage } from './ConfiguracionPage'

vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

describe('Enviar enlace desde configuración', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { name: 'Ana Campus', email: 'ana@campus.edu', role: 'Docente', photo: null },
      isAuthenticated: true, isLoading: false,
      login: vi.fn(), logout: vi.fn(), updateProfile: vi.fn(), updateProfilePhoto: vi.fn(),
    })
  })

  afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear() })

  it.each([
    [202, 'Si existe una cuenta con ese correo, recibira instrucciones.', 'status'],
    [503, 'El envio de correo no esta configurado.', 'alert'],
  ])('muestra la respuesta HTTP %s junto al botón y envía CSRF y la institución', async (status, detail, role) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ csrf_token: 'csrf-prueba' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail }), { status }))
    render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    const section = screen.getByRole('heading', { name: 'Recuperación de contraseña' }).closest('section')!
    expect(await within(section).findByRole(role)).toHaveTextContent(detail)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/login/recuperacion', expect.objectContaining({
      method: 'POST', credentials: 'include', body: JSON.stringify({ correo: 'ana@campus.edu' }),
      headers: expect.objectContaining({ 'X-CSRF-Token': 'csrf-prueba', 'X-Institution-Slug': 'uphn' }),
    }))
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeEnabled()
  })

  it('pide guardar un correo editado antes de solicitar la recuperación', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()
    render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>)
    await user.clear(screen.getByLabelText('Correo electrónico'))
    await user.type(screen.getByLabelText('Correo electrónico'), 'nuevo@campus.edu')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Guarda los cambios del correo')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('explica qué falta si la cuenta no tiene correo guardado', async () => {
    const auth = useAuth()
    vi.mocked(useAuth).mockReturnValue({ ...auth, user: { ...auth.user!, email: '' } })
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Agrega y guarda un correo')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
