import { Moon, Sun } from 'lucide-react'

import { useTheme } from '../../contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className="focus-ring grid h-10 w-10 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Activar tema oscuro' : 'Activar tema claro'}
      title={theme === 'light' ? 'Tema oscuro' : 'Tema claro'}
    >
      {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </button>
  )
}
