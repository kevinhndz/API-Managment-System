import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import './Workspace.css'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="workspace">
      <a className="workspace-skip" href="#workspace-content">Saltar al contenido</a>
      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarCollapsed((current) => !current)} />
      <div className="workspace-body">
        <Navbar onMenuClick={() => setSidebarOpen(true)} onSidebarToggle={() => setSidebarCollapsed((current) => !current)} sidebarCollapsed={sidebarCollapsed} />
        <main id="workspace-content" className="workspace-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
