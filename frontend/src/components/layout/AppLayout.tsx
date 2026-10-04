import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { GravityStarsBackground } from '../ui/GravityStarsBackground'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)

  return (
    <div className="warm-grid relative flex min-h-screen overflow-hidden bg-[#faf9f6] dark:bg-[#171817]">
      <GravityStarsBackground />
      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} width={sidebarWidth} onWidthChange={setSidebarWidth} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarCollapsed((current) => !current)} />
      <div className="relative z-10 min-w-0 flex-1">
        <Navbar onMenuClick={() => setSidebarOpen(true)} onSidebarToggle={() => setSidebarCollapsed((current) => !current)} sidebarCollapsed={sidebarCollapsed} />
        <div className="px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
