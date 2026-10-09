import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Moon, Settings, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import { navigationItems } from '../../config/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { CampusFlowLogo } from '../brand/CampusFlowLogo'
import './Navbar.css'

interface NavbarProps {
  onMenuClick: () => void
  onSidebarToggle: () => void
  sidebarCollapsed: boolean
}

export function Navbar({ onMenuClick, onSidebarToggle, sidebarCollapsed }: NavbarProps) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [greetingIndex, setGreetingIndex] = useState(0)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const current = navigationItems.find((item) => item.path === pathname)
    ?? (pathname.startsWith('/configuracion') ? { label: 'Settings' } : navigationItems[0])
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'bienvenido'
  const greetingCount = 3
  const dashboardGreetings = [
    { title: `¡Hola, ${firstName}!`, subtitle: 'Bienvenido al panel de control académico.' },
    { title: '¿Qué hay para hoy?', subtitle: 'Consulta la ocupación y actividad de tu campus.' },
    { title: 'Supervisa tu campus', subtitle: 'Infraestructura, cupos y métricas del ciclo activo.' },
  ]

  useEffect(() => {
    if (pathname !== '/') {
      setGreetingIndex(0)
      return
    }

    const interval = window.setInterval(() => {
      setGreetingIndex((index) => (index + 1) % greetingCount)
    }, 4200)

    return () => window.clearInterval(interval)
  }, [pathname, greetingCount])

  useEffect(() => {
    if (!accountMenuOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  return (
    <header className={`sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-4 border-b px-4 backdrop-blur-xl sm:px-8 lg:px-12 ${pathname === '/' ? 'border-[#e3e8ef]/80 bg-[#eef2f6]/90 dark:border-white/10 dark:bg-[#191625]/90' : 'border-[#e3e2df]/80 bg-[#faf9f6]/75 dark:border-[#39334b]/80 dark:bg-[#191625]/88'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <button className="pressable focus-ring hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e3e2df] bg-white text-[#5b0309] shadow-sm lg:grid dark:border-[#39334b] dark:bg-[#242033] dark:text-violet-200" type="button" onClick={onSidebarToggle} aria-label={sidebarCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'} title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}>
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <button className="pressable focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm lg:hidden dark:border-[#39334b] dark:bg-[#242033] dark:text-stone-200" type="button" onClick={onMenuClick} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>
        {pathname === '/' ? (
          <div className="min-w-0" aria-live="polite" aria-atomic="true">
            <h1 key={greetingIndex} className="dashboard-greeting-text truncate text-base font-bold tracking-[-0.025em] text-[#121926] dark:text-white sm:text-lg">{dashboardGreetings[greetingIndex].title}</h1>
            <p className="truncate text-[11px] text-[#697586] dark:text-stone-300 sm:text-xs">{dashboardGreetings[greetingIndex].subtitle}</p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a716f]"><CampusFlowLogo compact className="[&_img]:h-4 [&_img]:w-4" /> CampusFlow / espacio de trabajo</p>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-[-0.03em] text-[#1a1c1a] dark:text-white">{current.label}</h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden h-9 w-px bg-slate-200 sm:block dark:bg-[#39334b]" />
        <div className="flex items-center gap-3">
          <div className="relative" ref={accountMenuRef}>
            <button
              className="focus-ring flex items-center gap-2 rounded-full p-1 transition hover:bg-black/5 dark:hover:bg-white/5"
              type="button"
              aria-label="Abrir menu de cuenta"
              aria-controls="account-menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              <img className="h-10 w-10 rounded-full border border-[#ead7d7] object-cover shadow-sm dark:border-stone-700" src="/avatar-campus.svg" alt="Avatar de cuenta" />
              <span className="hidden text-left sm:block">
                <span className="block max-w-40 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</span>
                <span className="block max-w-40 truncate text-[11px] text-slate-500">{user?.role}</span>
              </span>
              <ChevronDown className="mr-1 hidden h-4 w-4 text-slate-500 sm:block" />
            </button>
            {accountMenuOpen && <div id="account-menu" className="account-menu-popover absolute right-0 top-full z-50 w-64 origin-top-right rounded-2xl border border-[#ead7d7] bg-[#fffaf8] p-2 shadow-xl dark:border-[#39334b] dark:bg-[#242033]" role="menu" aria-label="Opciones de cuenta">
              <div className="border-b border-[#ead7d7] px-3 py-2.5 dark:border-[#39334b]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b1118] dark:text-violet-200">Cuenta CampusFlow</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-stone-100">{user?.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-stone-400">{user?.email || user?.role}</p>
              </div>
              <Link to="/configuracion" role="menuitem" onClick={() => setAccountMenuOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#493735] transition-colors hover:bg-[#f4e8e8] dark:text-stone-100 dark:hover:bg-[#302a43]">
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button type="button" role="menuitemcheckbox" aria-checked={theme === 'dark'} onClick={toggleTheme} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-[#493735] transition-colors hover:bg-[#f4e8e8] dark:text-stone-100 dark:hover:bg-[#302a43]">
                <span className="flex items-center gap-3">{theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Modo oscuro</span>
                <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-[#5e35b1]' : 'bg-stone-300'}`} aria-hidden="true"><span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`} /></span>
                <span className="sr-only">{theme === 'dark' ? 'Activado' : 'Desactivado'}</span>
              </button>
              <div className="my-1 border-t border-[#ead7d7] dark:border-[#39334b]" />
              <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); logout() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-700 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>}
          </div>
        </div>
      </div>
    </header>
  )
}
