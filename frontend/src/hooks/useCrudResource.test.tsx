import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useCrudResource } from './useCrudResource'

afterEach(cleanup)
it('ignora una pagina anterior que llega despues de una busqueda nueva', async () => {
  type Page = { data: { id: number }[]; total: number; pagina_actual: number; limite: number; total_paginas: number }
  let oldResult!: (page: Page) => void
  const service = { list: vi.fn().mockImplementationOnce(() => new Promise<Page>((resolve) => { oldResult = resolve })).mockResolvedValue({ data: [{ id: 2 }], total: 1, pagina_actual: 1, limite: 10, total_paginas: 1 }), get: vi.fn(), create: vi.fn(), update: vi.fn(), patch: vi.fn(), remove: vi.fn() }
  const { result, rerender } = renderHook(({ query }) => useCrudResource(service, 10, query), { initialProps: { query: '' } })
  rerender({ query: 'DOC-002' })
  await waitFor(() => expect(result.current.items).toEqual([{ id: 2 }]))
  await act(async () => oldResult({ data: [{ id: 1 }], total: 20, pagina_actual: 1, limite: 10, total_paginas: 2 }))
  expect(result.current.items).toEqual([{ id: 2 }])
  expect(result.current.total).toBe(1)
})
