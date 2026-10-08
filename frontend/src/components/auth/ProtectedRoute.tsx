import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Comprobando sesion...</div>

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
