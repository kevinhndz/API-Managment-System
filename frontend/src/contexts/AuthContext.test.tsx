import { renderHook, act } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../services/api', () => ({
  iniciarSesion: vi.fn().mockResolvedValue({ autenticada: true }),
  cerrarSesion: vi.fn().mockResolvedValue(undefined),
  obtenerSesionActual: vi.fn().mockResolvedValue({ usuario: 'usuario-prueba', correo: null, rol: 'Administrador' }),
}))

const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>

describe('AuthProvider', () => {
  afterEach(() => localStorage.clear())

  it('inicia y cierra una sesión válida', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(() => result.current.login('usuario-prueba', 'clave-de-prueba-2026'))
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('campusflow.session')).toBeNull()

    act(() => result.current.logout())
    expect(result.current.isAuthenticated).toBe(false)
  })
})
