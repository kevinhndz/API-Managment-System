import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#f4f0e8] dark:bg-stone-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
