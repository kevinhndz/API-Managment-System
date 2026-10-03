import { BookOpen, Building2, GraduationCap, LayoutDashboard, UsersRound, type LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  path: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Aulas', path: '/aulas', icon: Building2 },
  { label: 'Docentes', path: '/docentes', icon: UsersRound },
  { label: 'Carreras', path: '/carreras', icon: GraduationCap },
]

export const brandIcon = BookOpen
