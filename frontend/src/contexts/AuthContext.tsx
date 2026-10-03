import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'

interface User {
  name: string
  email: string
  role: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const SESSION_KEY = 'campusflow.session'
const USER_KEY = 'campusflow.user'

export const DEMO_CREDENTIALS = {
  email: 'admin@campusflow.edu',
  password: 'Campus2026',
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): User | null {
  const stored = localStorage.getItem(USER_KEY)
  if (!stored || !localStorage.getItem(SESSION_KEY)) return null

  try {
    return JSON.parse(stored) as User
  } catch {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(readStoredUser)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login: async (email, password) => {
        await Promise.resolve()
        if (email.toLowerCase() !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
          throw new Error('Correo o contraseña incorrectos.')
        }

        const nextUser = { name: 'Administrador', email: DEMO_CREDENTIALS.email, role: 'Gestión académica' }
        localStorage.setItem(SESSION_KEY, 'demo-session')
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
