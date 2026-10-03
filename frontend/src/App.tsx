import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const AulasPage = lazy(() => import('./pages/AulasPage').then((module) => ({ default: module.AulasPage })))
const DocentesPage = lazy(() => import('./pages/DocentesPage').then((module) => ({ default: module.DocentesPage })))
const CarrerasPage = lazy(() => import('./pages/CarrerasPage').then((module) => ({ default: module.CarrerasPage })))

function PageLoader() {
  return <div className="h-72 animate-pulse rounded-2xl border bg-white dark:bg-slate-900" aria-label="Cargando página" />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="aulas" element={<Suspense fallback={<PageLoader />}><AulasPage /></Suspense>} />
          <Route path="docentes" element={<Suspense fallback={<PageLoader />}><DocentesPage /></Suspense>} />
          <Route path="carreras" element={<Suspense fallback={<PageLoader />}><CarrerasPage /></Suspense>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
