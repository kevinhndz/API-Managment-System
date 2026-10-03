import { renderHook, act } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { AuthProvider, DEMO_CREDENTIALS, useAuth } from './AuthContext'

const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>

describe('AuthProvider', () => {
  afterEach(() => localStorage.clear())

  it('inicia y cierra una sesión válida', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(() => result.current.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password))
    expect(result.current.isAuthenticated).toBe(true)

    act(() => result.current.logout())
    expect(result.current.isAuthenticated).toBe(false)
  })
})
