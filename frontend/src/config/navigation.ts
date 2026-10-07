import { BookOpen, Building2, GraduationCap, LayoutDashboard, UsersRound, UserRound, BookMarked, CalendarDays, CalendarClock, ClipboardList, Award, FileDown, History, type LucideIcon } from 'lucide-react'

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
  { label: 'Estudiantes', path: '/estudiantes', icon: UserRound },
  { label: 'Asignaturas', path: '/asignaturas', icon: BookMarked },
  { label: 'Periodos', path: '/periodos', icon: CalendarDays },
  { label: 'Secciones', path: '/secciones', icon: CalendarClock },
  { label: 'Matrículas', path: '/matriculas', icon: ClipboardList },
  { label: 'Calificaciones', path: '/calificaciones', icon: Award },
  { label: 'Reportes', path: '/reportes', icon: FileDown },
  { label: 'Actividad reciente', path: '/actividad', icon: History },
]

export const brandIcon = BookOpen
