import { createContext, useContext, useEffect, type PropsWithChildren } from 'react'

// El espacio academico usa el tema claro del sistema de diseno institucional.
const lightTheme: { theme: 'light' | 'dark'; toggleTheme: () => void } = { theme: 'light', toggleTheme: () => undefined }
const ThemeContext = createContext<typeof lightTheme | null>(null)

export function ThemeProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('campusflow.theme', 'light')
  }, [])
  return <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider.')
  return context
}
