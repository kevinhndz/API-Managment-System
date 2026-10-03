import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { navigationItems } from '../../config/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { ThemeToggle } from '../ui/ThemeToggle'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const current = navigationItems.find((item) => item.path === pathname) ?? navigationItems[0]

  return (
    <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-4 border-b border-[#e3e2df]/80 bg-[#faf9f6]/75 px-4 backdrop-blur-xl dark:border-stone-800/80 dark:bg-[#171817]/80 sm:px-8 lg:px-12">
      <div className="flex min-w-0 items-center gap-3">
        <button className="pressable focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm lg:hidden dark:bg-slate-900 dark:text-slate-300" type="button" onClick={onMenuClick} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a716f]">CampusFlow / espacio de trabajo</p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-[-0.03em] text-[#1a1c1a] dark:text-white">{current.label}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="hidden h-9 w-px bg-slate-200 sm:block dark:bg-slate-800" />
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-700 to-sage-500 text-sm font-semibold text-white">AD</span>
          <div className="hidden min-w-0 sm:block">
            <p className="max-w-40 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
            <p className="max-w-40 truncate text-[11px] text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
