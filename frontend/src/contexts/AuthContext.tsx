import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { cerrarSesion, iniciarSesion, obtenerSesionActual } from '../services/api'
import { queryClient } from '../lib/queryClient'

interface User {
  name: string
  email: string
  role: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (usuario: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    obtenerSesionActual()
      .then((session) => {
        if (mounted) setUser({ name: session.usuario, email: session.correo ?? '', role: session.rol })
      })
      .catch(() => {
        if (mounted) setUser(null)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login: async (usuario, password) => {
        await iniciarSesion(usuario, password)
        queryClient.clear()
        const session = await obtenerSesionActual()
        setUser({ name: session.usuario, email: session.correo ?? '', role: session.rol })
      },
      logout: () => {
        void cerrarSesion().catch(() => undefined)
        queryClient.clear()
        setUser(null)
      },
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return context
}
