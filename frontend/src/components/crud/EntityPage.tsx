import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import type { CrudService } from '../../services/api'
import { useCrudResource } from '../../hooks/useCrudResource'
import { usePagination } from '../../hooks/usePagination'
import { Modal } from '../ui/Modal'
import { TableSkeleton } from '../ui/Skeleton'
import { ActionMenu } from '../ui/ActionMenu'

interface EntityWithId {
  id: number
}

interface Column<T> {
  label: string
  render: (item: T) => ReactNode
}

interface FieldOption {
  label: string
  value: string
}

interface Field<TPayload> {
  key: keyof TPayload
  label: string
  type?: 'text' | 'email' | 'number' | 'date' | 'select' | 'checkbox'
  placeholder?: string
  min?: number
  max?: number
  options?: FieldOption[]
  valueType?: 'number' | 'text'
  required?: boolean
}

export interface StatusOption { value: string; label: string }

interface EntityPageProps<T extends EntityWithId, TPayload extends object> {
  title: string
  description: string
  singular: string
  newLabel: string
  service: CrudService<T, TPayload>
  columns: Column<T>[]
  fields: Field<TPayload>[]
  emptyPayload: TPayload
  toPayload: (item: T) => TPayload
  searchableText: (item: T) => string
  statusOptions?: StatusOption[]
  rowAction?: (item: T) => { label: string; icon: ReactNode; onSelect: () => void } | undefined
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-stone-800 dark:text-stone-200'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export function EntityPage<T extends EntityWithId, TPayload extends object>({
  title,
  description,
  singular,
  newLabel,
  service,
  columns,
  fields,
  emptyPayload,
  toPayload,
  searchableText,
  statusOptions,
  rowAction,
}: EntityPageProps<T, TPayload>) {
  const [query, setQuery] = useState('')
  const resource = useCrudResource(service, 10, query)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [pendingDelete, setPendingDelete] = useState<T | null>(null)
  const [form, setForm] = useState<TPayload>(emptyPayload)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [statusItems, setStatusItems] = useState<T[] | null>(null)
  const [statusRefresh, setStatusRefresh] = useState(0)
  const normalizeStatus = (value: string | boolean | undefined) => {
    if (value === true) return 'activo'
    if (value === false) return 'inactivo'
    return String(value ?? '').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  useEffect(() => {
    if (statusFilter === 'todos') { setStatusItems(null); return undefined }
    let active = true
    void (async () => {
      try {
        const first = await service.list({ pagina_actual: 1, limite: 100 })
        const rest = await Promise.all(Array.from({ length: Math.max(0, first.total_paginas - 1) }, (_, index) => service.list({ pagina_actual: index + 2, limite: 100 })))
        if (active) setStatusItems([...first.data, ...rest.flatMap((page) => page.data)])
      } catch {
        if (active) setStatusItems([])
      }
    })()
    return () => { active = false }
  }, [service, statusFilter, statusRefresh])
  const pagination = usePagination({ currentPage: resource.page, totalPages: Math.max(resource.totalPages, 1), paginationItemsToDisplay: 7 })

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    const matchesQuery = (item: T) => !normalized || searchableText(item).toLocaleLowerCase('es').includes(normalized)
    const matchesStatus = (item: T) => {
      if (statusFilter === 'todos') return true
      const value = (item as T & { estado?: string | boolean; activo?: boolean }).estado ?? (item as T & { activo?: boolean }).activo
      return normalizeStatus(value) === statusFilter
    }
    const sourceItems = statusFilter === 'todos' ? resource.items : statusItems ?? []
    return sourceItems.filter((item) => matchesQuery(item) && matchesStatus(item))
  }, [query, resource.items, searchableText, statusFilter, statusItems])

  const availableStatusOptions = useMemo<StatusOption[]>(() => {
    if (statusOptions?.length) return statusOptions
    const hasBooleanStatus = resource.items.some((item) => typeof (item as T & { activo?: unknown }).activo === 'boolean' || typeof (item as T & { estado?: unknown }).estado === 'boolean')
    if (hasBooleanStatus) return [{ value: 'activo', label: 'Activos' }, { value: 'inactivo', label: 'Inactivos' }]
    const values = new Set((statusItems ?? resource.items).map((item) => {
      const value = (item as T & { estado?: string | boolean; activo?: boolean }).estado ?? (item as T & { activo?: boolean }).activo
      return value === true ? 'activo' : value === false ? 'inactivo' : normalizeStatus(value)
    }).filter(Boolean))
    return [...values].map((value) => ({ value, label: value.charAt(0).toLocaleUpperCase('es') + value.slice(1) }))
  }, [resource.items, statusItems, statusOptions])
  const hasStatus = availableStatusOptions.length > 0 && resource.items.some((item) => 'estado' in item || 'activo' in item)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyPayload)
    setFormOpen(true)
  }

  const openEdit = (item: T) => {
    setEditing(item)
    setForm(toPayload(item))
    setFormOpen(true)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const success = editing ? await resource.update(editing.id, form) : await resource.create(form)
    if (success) { setFormOpen(false); setStatusRefresh((value) => value + 1) }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const success = await resource.remove(pendingDelete.id)
    if (success) { setPendingDelete(null); setStatusRefresh((value) => value + 1) }
  }

  const updateField = (field: Field<TPayload>, value: string | boolean) => {
    const nextValue = field.type === 'number' || field.valueType === 'number' ? value === '' && field.required === false ? null : Number(value) : value
    setForm((current) => ({ ...current, [field.key]: nextValue }))
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-sage-600 dark:text-sage-400">Módulo académico</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-navy-950 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <button className="focus-ring flex h-11 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-800 dark:bg-sage-500 dark:hover:bg-sage-600" type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {newLabel}
        </button>
      </header>

      <section className="overflow-hidden rounded-2xl border bg-[#fffdf8] shadow-panel dark:bg-stone-900">
        <div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center">
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="focus-ring h-10 w-full rounded-xl border bg-[#faf7f0] pl-10 pr-4 text-sm placeholder:text-slate-400 dark:bg-stone-950" value={query} onChange={(event) => { setQuery(event.target.value); resource.setPage(1) }} placeholder={`Buscar ${title.toLocaleLowerCase('es')}…`} />
          </label>
          <div className="flex flex-wrap items-center gap-3"><p className="text-xs text-slate-400">{resource.total} registros</p>{hasStatus && <select className="focus-ring h-10 rounded-xl border bg-[#faf7f0] px-3 text-xs font-semibold text-slate-600 dark:bg-stone-950 dark:text-slate-300" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); resource.setPage(1) }} aria-label="Filtrar por estado"><option value="todos">Todos los estados</option>{availableStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}<p className="w-full text-xs font-medium text-[#8a716f] sm:w-auto">{statusFilter === 'todos' ? `Se encontraron ${filteredItems.length} registros en esta página` : `Se encontraron ${filteredItems.length} registros con estado ${availableStatusOptions.find((option) => option.value === statusFilter)?.label?.toLocaleLowerCase('es') ?? statusFilter}`}</p></div>
        </div>

        {resource.error && <div className="border-b bg-red-50 px-5 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{resource.error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b bg-[#faf7f0]/80 dark:bg-[#3b2e2b]">
                {columns.map((column) => <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400" key={column.label}>{column.label}</th>)}
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
              {resource.loading ? (
                <tr><td className="px-5 py-10" colSpan={columns.length + 1}><TableSkeleton columns={columns.length} /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td className="px-5 py-14 text-center text-sm text-slate-400" colSpan={columns.length + 1}>No se encontraron registros.</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr className="transition hover:bg-slate-50/70 dark:hover:bg-stone-800/60" key={item.id}>
                    {columns.map((column) => <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 dark:text-slate-300" key={column.label}>{column.render(item)}</td>)}
                    <td className="px-5 py-4 text-right"><ActionMenu singular={singular} onEdit={() => openEdit(item)} onDelete={() => setPendingDelete(item)} extraAction={rowAction?.(item)} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">Página {resource.page} de {Math.max(resource.totalPages, 1)} · {filteredItems.length} visibles</p>
          <nav className="flex max-w-full items-center justify-center gap-1 overflow-x-auto pb-0.5" aria-label={`Paginación de ${title.toLocaleLowerCase('es')}`}>
            <button className="focus-ring grid h-9 w-9 place-items-center rounded-lg border text-slate-500 transition hover:bg-[#faf7f0] disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-stone-800" type="button" disabled={resource.page <= 1 || resource.loading} onClick={() => resource.setPage((page) => page - 1)} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
            {pagination.showLeftEllipsis && <><button className="focus-ring grid h-9 w-9 place-items-center rounded-lg text-sm text-slate-600 hover:bg-[#faf7f0] dark:text-slate-300 dark:hover:bg-stone-800" type="button" onClick={() => resource.setPage(1)} aria-label="Ir a la primera página">1</button><span className="grid h-9 w-6 place-items-center text-slate-400" aria-hidden="true">…</span></>}
            {pagination.pages.map((page) => <button className={`focus-ring grid h-9 w-9 place-items-center rounded-lg text-sm font-medium transition ${resource.page === page ? 'bg-[#5b0309] text-white shadow-sm dark:bg-rose-900' : 'text-slate-600 hover:bg-[#faf7f0] dark:text-slate-300 dark:hover:bg-stone-800'}`} type="button" key={page} disabled={resource.loading} onClick={() => resource.setPage(page)} aria-current={resource.page === page ? 'page' : undefined} aria-label={`Ir a la página ${page}`}>{page}</button>)}
            {pagination.showRightEllipsis && <><span className="grid h-9 w-6 place-items-center text-slate-400" aria-hidden="true">…</span><button className="focus-ring grid h-9 w-9 place-items-center rounded-lg text-sm text-slate-600 hover:bg-[#faf7f0] dark:text-slate-300 dark:hover:bg-stone-800" type="button" onClick={() => resource.setPage(resource.totalPages)} aria-label="Ir a la última página">{resource.totalPages}</button></>}
            <button className="focus-ring grid h-9 w-9 place-items-center rounded-lg border text-slate-500 transition hover:bg-[#faf7f0] disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-stone-800" type="button" disabled={resource.page >= resource.totalPages || resource.loading} onClick={() => resource.setPage((page) => page + 1)} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></button>
          </nav>
        </div>
      </section>

      <Modal open={formOpen} title={editing ? `Editar ${singular.toLocaleLowerCase('es')}` : newLabel} description="Completa los campos requeridos." onClose={() => setFormOpen(false)}>
        <form onSubmit={(event) => void submit(event)}>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {fields.map((field) => {
              const value = form[field.key]
              if (field.type === 'checkbox') {
                return <label className="flex items-center gap-3 self-end rounded-xl border bg-[#faf7f0] px-4 py-3 text-sm font-medium text-slate-700 dark:bg-stone-950 dark:text-slate-200" key={String(field.key)}><input className="peer sr-only" type="checkbox" checked={Boolean(value)} onChange={(event) => updateField(field, event.target.checked)} /><span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-[#7b4bd9] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#7b4bd9]/50 dark:bg-stone-700" />{field.label}</label>
              }

              const sharedClass = 'focus-ring mt-2 h-11 w-full rounded-xl border bg-[#faf7f0] px-3.5 text-sm dark:bg-stone-950'
              return (
                <label className="block" key={String(field.key)}>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{field.label}</span>
                  {field.type === 'select' ? (
                    <select className={sharedClass} value={String(value ?? '')} onChange={(event) => updateField(field, event.target.value)} required={field.required !== false}>
                      {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (
                    <input className={sharedClass} type={field.type ?? 'text'} value={String(value ?? '')} placeholder={field.placeholder} min={field.min} max={field.max} onChange={(event) => updateField(field, event.target.value)} required={field.required !== false} />
                  )}
                </label>
              )
            })}
          </div>
          <div className="flex justify-end gap-3 border-t px-6 py-4">
            <button className="focus-ring h-10 rounded-xl border px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-stone-200 dark:hover:bg-stone-800" type="button" onClick={() => setFormOpen(false)}>Cancelar</button>
            <button className="focus-ring h-10 rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60 dark:bg-sage-500" type="submit" disabled={resource.saving}>{resource.saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={pendingDelete !== null} title={`Eliminar ${singular.toLocaleLowerCase('es')}`} description="Esta acción no se puede deshacer." onClose={() => setPendingDelete(null)}>
        <div className="p-6"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">¿Confirmas que deseas eliminar este registro?</p></div>
        <div className="flex justify-end gap-3 border-t px-6 py-4"><button className="focus-ring h-10 rounded-xl border px-4 text-sm font-semibold text-slate-600 dark:text-slate-300" type="button" onClick={() => setPendingDelete(null)}>Cancelar</button><button className="focus-ring h-10 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60" type="button" onClick={() => void confirmDelete()} disabled={resource.saving}>{resource.saving ? 'Eliminando…' : 'Eliminar'}</button></div>
      </Modal>
    </div>
  )
}
