import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdministratorRoute } from './components/auth/AdministratorRoute'
import { useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { ConfiguracionPage } from './pages/ConfiguracionPage'
import { RecuperacionPage } from './pages/RecuperacionPage'
import { SolicitudCuentaPage } from './pages/SolicitudCuentaPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const AulasPage = lazy(() => import('./pages/AulasPage').then((module) => ({ default: module.AulasPage })))
const DocentesPage = lazy(() => import('./pages/DocentesPage').then((module) => ({ default: module.DocentesPage })))
const CarrerasPage = lazy(() => import('./pages/CarrerasPage').then((module) => ({ default: module.CarrerasPage })))
const EstudiantesPage = lazy(() => import('./pages/EstudiantesPage').then((module) => ({ default: module.EstudiantesPage })))
const AsignaturasPage = lazy(() => import('./pages/AsignaturasPage').then((module) => ({ default: module.AsignaturasPage })))
const PeriodosPage = lazy(() => import('./pages/PeriodosPage').then((module) => ({ default: module.PeriodosPage })))
const SeccionesPage = lazy(() => import('./pages/SeccionesPage').then((module) => ({ default: module.SeccionesPage })))
const MatriculasPage = lazy(() => import('./pages/MatriculasPage').then((module) => ({ default: module.MatriculasPage })))
const CalificacionesPage = lazy(() => import('./pages/CalificacionesPage').then((module) => ({ default: module.CalificacionesPage })))
const ReportesPage = lazy(() => import('./pages/ReportesPage').then((module) => ({ default: module.ReportesPage })))
const ActividadPage = lazy(() => import('./pages/ActividadPage').then((module) => ({ default: module.ActividadPage })))
const SolicitudesCuentaPage = lazy(() => import('./pages/SolicitudesCuentaPage').then((module) => ({ default: module.SolicitudesCuentaPage })))

function PageLoader() {
  return <div className="h-72 animate-pulse rounded-2xl border bg-[#fffdf8] dark:bg-stone-900" aria-label="Cargando página" />
}

function HomeRoute() {
  const { user } = useAuth()
  const esAdministrador = ['admin', 'administrador'].includes(user?.role.toLocaleLowerCase('es') ?? '')
  return esAdministrador
    ? <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>
    : <Navigate to="/estudiantes" replace />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/solicitar-cuenta" element={<SolicitudCuentaPage />} />
      <Route path="/recuperar-contrasena" element={<RecuperacionPage />} />
      <Route path="/restablecer-contrasena" element={<RecuperacionPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRoute />} />
          <Route path="estudiantes" element={<Suspense fallback={<PageLoader />}><EstudiantesPage /></Suspense>} />
          <Route path="calificaciones" element={<Suspense fallback={<PageLoader />}><CalificacionesPage /></Suspense>} />
          <Route path="reportes" element={<Suspense fallback={<PageLoader />}><ReportesPage /></Suspense>} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route element={<AdministratorRoute />}>
            <Route path="aulas" element={<Suspense fallback={<PageLoader />}><AulasPage /></Suspense>} />
            <Route path="docentes" element={<Suspense fallback={<PageLoader />}><DocentesPage /></Suspense>} />
            <Route path="carreras" element={<Suspense fallback={<PageLoader />}><CarrerasPage /></Suspense>} />
            <Route path="asignaturas" element={<Suspense fallback={<PageLoader />}><AsignaturasPage /></Suspense>} />
            <Route path="periodos" element={<Suspense fallback={<PageLoader />}><PeriodosPage /></Suspense>} />
            <Route path="secciones" element={<Suspense fallback={<PageLoader />}><SeccionesPage /></Suspense>} />
            <Route path="matriculas" element={<Suspense fallback={<PageLoader />}><MatriculasPage /></Suspense>} />
            <Route path="actividad" element={<Suspense fallback={<PageLoader />}><ActividadPage /></Suspense>} />
            <Route path="configuracion/solicitudes" element={<Suspense fallback={<PageLoader />}><SolicitudesCuentaPage /></Suspense>} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
