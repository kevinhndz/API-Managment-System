import { renderHook, act } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider, PRUEBA_CREDENTIALS, useAuth } from './AuthContext'

vi.mock('../services/api', () => ({ iniciarSesion: vi.fn().mockResolvedValue({ token: 'token-de-prueba', tipo: 'bearer' }) }))

const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>

describe('AuthProvider', () => {
  afterEach(() => localStorage.clear())

  it('inicia y cierra una sesión válida', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(() => result.current.login(PRUEBA_CREDENTIALS.usuario, PRUEBA_CREDENTIALS.password))
    expect(result.current.isAuthenticated).toBe(true)

    act(() => result.current.logout())
    expect(result.current.isAuthenticated).toBe(false)
  })
})
