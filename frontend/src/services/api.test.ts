import { afterEach, describe, expect, it, vi } from 'vitest'

import { aulasApi } from './api'

describe('aulasApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('envía los parámetros de paginación esperados', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ total: 0, pagina_actual: 2, limite: 25, total_paginas: 0, data: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await aulasApi.list({ pagina_actual: 2, limite: 25 })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/aulas/?pagina_actual=2&limite=25',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    )
  })
})
