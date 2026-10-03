import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { AulasPage } from './pages/AulasPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="aulas" element={<AulasPage />} />
          <Route path="docentes" element={<PlaceholderPage title="Docentes" description="Administra el directorio y estado del personal docente." />} />
          <Route path="carreras" element={<PlaceholderPage title="Carreras" description="Organiza la oferta académica y duración de programas." />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
