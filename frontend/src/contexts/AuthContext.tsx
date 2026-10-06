import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import { iniciarSesion } from '../services/api'

interface User {
  name: string
  email: string
  role: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (usuario: string, password: string) => Promise<void>
  logout: () => void
}

const SESSION_KEY = 'campusflow.session'
const USER_KEY = 'campusflow.user'

export const PRUEBA_CREDENTIALS = {
  usuario: 'admin',
  password: 'Campus2026',
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): User | null {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(SESSION_KEY)
  return null
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(readStoredUser)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login: async (usuario, password) => {
        const respuesta = await iniciarSesion(usuario, password)
        const nextUser = { name: usuario, email: usuario, role: 'Gestión académica' }
        localStorage.setItem(SESSION_KEY, respuesta.token)
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
        setUser(nextUser)
      },
      logout: () => {
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return context
}
