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

  it('migra preferencias anteriores al tema claro institucional', () => {
    localStorage.setItem('campusflow.theme', 'dark')
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => result.current.toggleTheme())

    expect(document.documentElement).not.toHaveClass('dark')
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('campusflow.theme')).toBe('light')
  })
})
