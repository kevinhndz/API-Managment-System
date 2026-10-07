import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'

interface ActionMenuProps {
  singular: string
  onEdit: () => void
  onDelete: () => void
  extraAction?: {
    label: string
    icon: ReactNode
    onSelect: () => void
  }
}

export function ActionMenu({ singular, onEdit, onDelete, extraAction }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const choose = (action: () => void) => {
    setOpen(false)
    action()
    triggerRef.current?.focus()
  }

  return <div className="relative inline-block text-left" ref={menuRef}>
    <button ref={triggerRef} className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg border bg-[#fffdf8] px-3 text-xs font-semibold text-[#574240] shadow-sm transition hover:bg-[#faf7f0] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800" type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      Acciones
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="action-menu__popover" role="menu" aria-label={`Acciones de ${singular.toLocaleLowerCase('es')}`}>
      {extraAction && <button className="action-menu__item" type="button" role="menuitem" onClick={() => choose(extraAction.onSelect)}>{extraAction.icon}{extraAction.label}</button>}
      <button className="action-menu__item action-menu__item--edit" type="button" role="menuitem" onClick={() => choose(onEdit)}><Pencil className="h-4 w-4" />Editar</button>
      <button className="action-menu__item action-menu__item--delete" type="button" role="menuitem" onClick={() => choose(onDelete)}><Trash2 className="h-4 w-4" />Eliminar</button>
    </div>}
  </div>
}
