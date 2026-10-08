import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

import { navigationItems } from '../../config/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { ThemeToggle } from '../ui/ThemeToggle'

interface NavbarProps {
  onMenuClick: () => void
  onSidebarToggle: () => void
  sidebarCollapsed: boolean
}

export function Navbar({ onMenuClick, onSidebarToggle, sidebarCollapsed }: NavbarProps) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const current = navigationItems.find((item) => item.path === pathname) ?? navigationItems[0]

  return (
    <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-4 border-b border-[#e3e2df]/80 bg-[#faf9f6]/75 px-4 backdrop-blur-xl dark:border-stone-800/80 dark:bg-[#261f1d]/88 sm:px-8 lg:px-12">
      <div className="flex min-w-0 items-center gap-3">
        <button className="pressable focus-ring hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e3e2df] bg-white text-[#5b0309] shadow-sm lg:grid dark:border-stone-700 dark:bg-stone-900 dark:text-rose-200" type="button" onClick={onSidebarToggle} aria-label={sidebarCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'} title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}>
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <button className="pressable focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm lg:hidden dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" type="button" onClick={onMenuClick} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a716f]">CampusFlow / espacio de trabajo</p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-[-0.03em] text-[#1a1c1a] dark:text-white">{current.label}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="hidden h-9 w-px bg-slate-200 sm:block dark:bg-stone-700" />
        <div className="flex items-center gap-3">
          <div className="relative" onMouseEnter={() => setAccountMenuOpen(true)} onMouseLeave={() => setAccountMenuOpen(false)}>
            <button
              className="focus-ring flex items-center gap-2 rounded-full p-1 transition hover:bg-black/5 dark:hover:bg-white/5"
              type="button"
              aria-label="Abrir menu de cuenta"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
              onFocus={() => setAccountMenuOpen(true)}
            >
              <img className="h-10 w-10 rounded-full border border-[#ead7d7] object-cover shadow-sm dark:border-stone-700" src="/avatar-campus.svg" alt="Avatar de cuenta" />
              <span className="hidden text-left sm:block">
                <span className="block max-w-40 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</span>
                <span className="block max-w-40 truncate text-[11px] text-slate-500">{user?.role}</span>
              </span>
              <ChevronDown className="mr-1 hidden h-4 w-4 text-slate-500 sm:block" />
            </button>
            {accountMenuOpen && <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[#ead7d7] bg-[#fffaf8] p-2 shadow-xl dark:border-stone-700 dark:bg-[#302624]" role="menu" aria-label="Opciones de cuenta">
              <div className="border-b border-[#ead7d7] px-3 py-2 dark:border-stone-700 sm:hidden">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.role}</p>
              </div>
              <Link to="/configuracion" role="menuitem" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#493735] transition hover:bg-[#f4e8e8] dark:text-stone-100 dark:hover:bg-stone-800">
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); logout() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-700 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30">
                <LogOut className="h-4 w-4" /> Cerrar sesion
              </button>
            </div>}
          </div>
        </div>
      </div>
    </header>
  )
}
