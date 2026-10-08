import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react'

import './ExpandableSearchBar.css'

export interface ExpandableSearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
  placeholder?: string
  ariaLabel: string
  className?: string
  defaultOpen?: boolean
  expandDirection?: 'left' | 'right'
  width?: number
}

export function ExpandableSearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  ariaLabel,
  className = '',
  defaultOpen = false,
  expandDirection = 'right',
  width = 280,
}: ExpandableSearchBarProps) {
  const [open, setOpen] = useState(defaultOpen)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node) && open && !value.trim()) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open, value])

  useEffect(() => {
    if (!open) return

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 120)
    return () => window.clearTimeout(focusTimer)
  }, [open])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch?.(value.trim())
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onChange('')
      setOpen(false)
    }
  }

  const closeSearch = () => {
    onChange('')
    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={`expandable-search-bar ${open ? 'is-open' : ''} ${className}`}
      role="search"
      style={{ '--search-width': `${width}px` } as CSSProperties}
    >
      <form
        aria-label={ariaLabel}
        className={`expandable-search-bar__surface ${expandDirection === 'left' ? 'expandable-search-bar__surface--left' : ''}`}
        data-open={open}
        onSubmit={submitSearch}
      >
        <input
          ref={inputRef}
          aria-label={ariaLabel}
          aria-hidden={!open}
          autoComplete="off"
          className={`expandable-search-bar__input ${expandDirection === 'left' ? 'expandable-search-bar__input--left' : ''}`}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          tabIndex={open ? 0 : -1}
          type="search"
          value={value}
        />
      </form>

      <button
        aria-expanded={open}
        aria-label={open ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
        className={`expandable-search-bar__toggle ${expandDirection === 'left' ? 'expandable-search-bar__toggle--left' : ''}`}
        onClick={() => (open ? closeSearch() : setOpen(true))}
        type="button"
      >
        {open ? <X aria-hidden="true" className="h-4 w-4" /> : <Search aria-hidden="true" className="h-4 w-4" />}
      </button>
    </div>
  )
}
