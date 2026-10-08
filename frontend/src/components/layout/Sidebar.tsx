import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { brandIcon as BrandIcon, navigationItems } from '../../config/navigation'
import { useAuth } from '../../contexts/AuthContext'

interface SidebarProps {
  open: boolean
  collapsed: boolean
  width: number
  onWidthChange: (width: number) => void
  onClose: () => void
  onToggle: () => void
}

export function Sidebar({ open, collapsed, width, onWidthChange, onClose, onToggle }: SidebarProps) {
  const { user } = useAuth()
  const esAdministrador = ['admin', 'administrador'].includes(user?.role.toLocaleLowerCase('es') ?? '')
  const itemsPermitidos = esAdministrador
    ? navigationItems
    : navigationItems.filter((item) => ['/estudiantes', '/calificaciones'].includes(item.path))
  const [resizing, setResizing] = useState(false)
  const [groups, setGroups] = useState({ academico: true, oferta: true, operacion: true, administracion: true })
  const groupedNavigation = [
    { key: 'academico' as const, label: 'Gestión académica', items: itemsPermitidos.filter((item) => ['/aulas', '/docentes', '/carreras', '/estudiantes'].includes(item.path)) },
    { key: 'oferta' as const, label: 'Oferta y periodos', items: itemsPermitidos.filter((item) => ['/asignaturas', '/periodos', '/secciones'].includes(item.path)) },
    { key: 'operacion' as const, label: 'Operación académica', items: itemsPermitidos.filter((item) => ['/matriculas', '/calificaciones'].includes(item.path)) },
    { key: 'administracion' as const, label: 'Administración', items: itemsPermitidos.filter((item) => ['/reportes', '/actividad'].includes(item.path)) },
  ]

  return (
    <>
      <button
        className={`fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm transition-opacity lg:hidden ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
      />
      <aside
        className={`group fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#e3e2df] bg-[#f4f3f0] px-4 py-6 shadow-xl transition-[width,transform] duration-300 ease-[var(--ease-drawer)] dark:border-stone-800 dark:bg-[#302624] lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${resizing ? 'select-none' : ''} w-64 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ '--sidebar-width': `${collapsed ? 88 : width}px` } as React.CSSProperties}
      >
        <div
          className="absolute inset-y-0 -right-1 hidden w-2 cursor-col-resize lg:block"
          role="separator"
          aria-label="Ajustar ancho del menú lateral"
          aria-orientation="vertical"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            setResizing(true)
          }}
          onPointerMove={(event) => {
            if (!resizing) return
            onWidthChange(Math.min(420, Math.max(200, event.clientX)))
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId)
            setResizing(false)
          }}
        />
        <div className={`flex items-center px-2 ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-white dark:bg-sage-500">
              <BrandIcon className="h-5 w-5" />
            </span>
            <div className={collapsed ? 'lg:hidden' : ''}>
              <p className="font-semibold tracking-[-0.03em] text-[#5b0309] dark:text-rose-200">CampusFlow</p>
              <p className="text-[11px] text-slate-400">Gestión académica</p>
            </div>
          </div>
          <button className="focus-ring grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:text-stone-300 dark:hover:bg-stone-800" type="button" onClick={onClose} aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>

        <button className="focus-ring absolute -right-3 top-24 z-10 hidden h-7 w-7 place-items-center rounded-full border border-[#dedbd6] bg-[#faf9f6] text-[#5b0309] shadow-sm transition hover:scale-105 lg:grid dark:border-stone-700 dark:bg-stone-800 dark:text-rose-200" type="button" onClick={onToggle} aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'} title={collapsed ? 'Expandir menú' : 'Colapsar menú'}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <nav className={`mt-12 flex-1 space-y-1.5 ${collapsed ? 'lg:px-1' : ''}`} aria-label="Navegación principal">
          {itemsPermitidos.filter((item) => item.path === '/').map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${collapsed ? 'lg:justify-center lg:px-2' : ''} ${
                  isActive
                    ? 'bg-[#5b0309] text-white shadow-sm dark:bg-[#7a1c1c]'
                    : 'text-[#574240] hover:bg-[#e9e8e5] hover:text-[#5b0309] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
            </NavLink>
          ))}
          {groupedNavigation.map((group) => <section className="mt-5" key={group.key}>
            <button className={`focus-ring mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a716f] hover:bg-[#e9e8e5] dark:hover:bg-stone-800 ${collapsed ? 'lg:justify-center' : ''}`} type="button" onClick={() => setGroups((current) => ({ ...current, [group.key]: !current[group.key] }))} aria-expanded={collapsed ? undefined : groups[group.key]} title={group.label}>
              <span className={collapsed ? 'lg:hidden' : ''}>{group.label}</span><ChevronDown className={`${collapsed ? 'lg:hidden' : ''} h-3.5 w-3.5 transition-transform ${groups[group.key] ? '' : '-rotate-90'}`} />
            </button>
            {groups[group.key] && <div className="space-y-1.5">{group.items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} onClick={onClose} className={({ isActive }) => `focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${collapsed ? 'lg:justify-center lg:px-2' : ''} ${isActive ? 'bg-[#5b0309] text-white shadow-sm dark:bg-[#7a1c1c]' : 'text-[#574240] hover:bg-[#e9e8e5] hover:text-[#5b0309] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white'}`}><Icon className="h-[18px] w-[18px]" /><span className={collapsed ? 'lg:hidden' : ''}>{label}</span></NavLink>)}</div>}
          </section>)}
        </nav>

      </aside>
    </>
  )
}
