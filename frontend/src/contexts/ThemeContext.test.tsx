import { renderHook, act } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { ThemeProvider, useTheme } from './ThemeContext'

const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider>

describe('ThemeProvider', () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('persiste el tema seleccionado', () => {
    localStorage.setItem('campusflow.theme', 'light')
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => result.current.toggleTheme())

    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('campusflow.theme')).toBe('dark')
  })
})
