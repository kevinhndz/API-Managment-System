import { LogOut, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { brandIcon as BrandIcon, navigationItems } from '../../config/navigation'
import { useAuth } from '../../contexts/AuthContext'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { logout } = useAuth()

  return (
    <>
      <button
        className={`fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm transition-opacity lg:hidden ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/80 bg-white px-4 py-6 shadow-xl transition-transform duration-300 ease-[var(--ease-drawer)] dark:border-slate-800 dark:bg-[#131a1b] lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-white dark:bg-sage-500">
              <BrandIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold tracking-[-0.03em] text-navy-950 dark:text-white">CampusFlow</p>
              <p className="text-[11px] text-slate-400">Gestión académica</p>
            </div>
          </div>
          <button className="focus-ring grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-900" type="button" onClick={onClose} aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-12 flex-1 space-y-1.5" aria-label="Navegación principal">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Administración</p>
          {navigationItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-sm dark:bg-sage-500'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-300"
          type="button"
          onClick={logout}
        >
          <LogOut className="h-[18px] w-[18px]" />
          Cerrar sesión
        </button>
      </aside>
    </>
  )
}
