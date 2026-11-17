import { useCallback, useEffect, useRef, useState } from 'react'

import type { CrudService } from '../services/api'
import { dashboardQueryKey, queryClient } from '../lib/queryClient'

export function useCrudResource<T, TPayload>(service: CrudService<T, TPayload>, limit = 10, busqueda = '') {
  const requestId = useRef(0)
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const response = await service.list({ pagina_actual: page, limite: limit, busqueda })
      if (id !== requestId.current) return
      setItems(response.data)
      setTotal(response.total)
      setTotalPages(response.total_paginas)
    } catch (requestError) {
      if (id !== requestId.current) return
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los registros.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [busqueda, limit, page, service])

  useEffect(() => {
    void load()
    return () => { requestId.current += 1 }
  }, [load])

  const runMutation = async (action: () => Promise<unknown>) => {
    setSaving(true)
    setError('')
    try {
      await action()
      await load()
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKey })
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el registro.')
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    items,
    page,
    setPage,
    total,
    totalPages,
    loading,
    saving,
    error,
    refresh: load,
    create: (payload: TPayload) => runMutation(() => service.create(payload)),
    update: (id: number, payload: TPayload) => runMutation(() => service.update(id, payload)),
    remove: (id: number) => runMutation(() => service.remove(id)),
  }
}
