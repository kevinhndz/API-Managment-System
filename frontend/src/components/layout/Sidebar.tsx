import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { navigationItems } from '../../config/navigation'
import { CampusFlowLogo } from '../brand/CampusFlowLogo'
import { useAuth } from '../../contexts/AuthContext'

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onToggle: () => void
}

export function Sidebar({ open, collapsed, onClose }: SidebarProps) {
  const { user } = useAuth()
  const esAdministrador = ['admin', 'administrador'].includes(user?.role.toLocaleLowerCase('es') ?? '')
  const items = esAdministrador ? navigationItems : navigationItems.filter((item) => ['/estudiantes', '/calificaciones', '/reportes'].includes(item.path))
  const [groups, setGroups] = useState<Record<string, boolean>>({ academico: true, oferta: true, operacion: true, administracion: true })
  const groupedNavigation = [
    { key: 'academico', label: 'Gestión académica', paths: ['/aulas', '/docentes', '/carreras', '/estudiantes'] },
    { key: 'oferta', label: 'Oferta y períodos', paths: ['/asignaturas', '/periodos', '/secciones'] },
    { key: 'operacion', label: 'Operación académica', paths: ['/matriculas', '/calificaciones'] },
    { key: 'administracion', label: 'Administración', paths: ['/reportes', '/finanzas', '/planes', '/importaciones', '/actividad'] },
  ]

  function link(item: typeof navigationItems[number]) {
    const Icon = item.icon
    return <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={onClose} title={collapsed ? item.label : undefined} className={({ isActive }) => `workspace-nav-link focus-ring ${isActive ? 'is-active' : ''}`}>
      <Icon size={18} aria-hidden="true" /><span>{item.label}</span>
    </NavLink>
  }

  return <>
    {open && <button className="workspace-sidebar-backdrop" type="button" aria-label="Cerrar menú" onClick={onClose} />}
    <aside className={`workspace-sidebar ${collapsed ? 'is-collapsed' : ''} ${open ? 'is-open' : ''}`} aria-label="Menú lateral">
      <div className="workspace-brand"><CampusFlowLogo /><button type="button" className="focus-ring workspace-menu-close" aria-label="Cerrar menú" onClick={onClose}><X size={20} /></button></div>
      <nav aria-label="Navegación principal">
        {items.filter((item) => item.path === '/').map(link)}
        {groupedNavigation.map((group) => {
          const groupItems = items.filter((item) => group.paths.includes(item.path)).sort((a, b) => group.paths.indexOf(a.path) - group.paths.indexOf(b.path))
          if (!groupItems.length) return null
          return <section key={group.key}>
            <button type="button" className="workspace-nav-group focus-ring" aria-expanded={groups[group.key]} aria-label={group.label} onClick={() => setGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}>
              <span>{group.label}</span><ChevronDown size={12} className={groups[group.key] ? '' : '-rotate-90'} />
            </button>
            {(collapsed || groups[group.key]) && groupItems.map(link)}
          </section>
        })}
      </nav>
    </aside>
  </>
}
