import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'

export function AdministratorRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div className="grid min-h-64 place-items-center text-sm text-slate-500">Comprobando permisos...</div>
  if (!['admin', 'administrador'].includes(user?.role.toLocaleLowerCase('es') ?? '')) {
    return <Navigate to="/estudiantes" replace />
  }

  return <Outlet />
}
