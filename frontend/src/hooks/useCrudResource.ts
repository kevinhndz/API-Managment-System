import { useCallback, useEffect, useState } from 'react'

import type { CrudService } from '../services/api'

export function useCrudResource<T, TPayload>(service: CrudService<T, TPayload>, limit = 10) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await service.list({ pagina_actual: page, limite: limit })
      setItems(response.data)
      setTotal(response.total)
      setTotalPages(response.total_paginas)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los registros.')
    } finally {
      setLoading(false)
    }
  }, [limit, page, service])

  useEffect(() => {
    void load()
  }, [load])

  const runMutation = async (action: () => Promise<unknown>) => {
    setSaving(true)
    setError('')
    try {
      await action()
      await load()
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
