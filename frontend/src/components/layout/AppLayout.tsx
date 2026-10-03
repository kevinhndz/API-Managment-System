import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="warm-grid flex min-h-screen bg-[#faf9f6] dark:bg-[#171817]">
      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarCollapsed((current) => !current)} />
      <div className="min-w-0 flex-1">
        <Navbar onMenuClick={() => setSidebarOpen(true)} onSidebarToggle={() => setSidebarCollapsed((current) => !current)} sidebarCollapsed={sidebarCollapsed} />
        <div className="px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
