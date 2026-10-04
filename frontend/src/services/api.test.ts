import { afterEach, describe, expect, it, vi } from 'vitest'

import { aulasApi } from './api'
import { matriculasApi, calificacionesApi } from './api'

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

  it('conecta los módulos que usan relaciones académicas', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ total: 0, pagina_actual: 1, limite: 100, total_paginas: 0, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    await matriculasApi.list()
    await calificacionesApi.list()
    expect(fetchMockPaths()).toEqual(['/api/matriculas/?pagina_actual=1&limite=100', '/api/calificaciones/?pagina_actual=1&limite=100'])
  })
})

function fetchMockPaths() { return vi.mocked(globalThis.fetch).mock.calls.map(([input]) => String(input)) }
