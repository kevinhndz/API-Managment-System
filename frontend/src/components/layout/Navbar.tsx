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
    <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-[#f5f7f8]/90 px-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#101516]/90 sm:px-6 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button className="pressable focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm lg:hidden dark:bg-slate-900 dark:text-slate-300" type="button" onClick={onMenuClick} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">CampusFlow / espacio de trabajo</p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-[-0.03em] text-navy-950 dark:text-white">{current.label}</h1>
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
