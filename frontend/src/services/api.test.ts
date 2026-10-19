import { afterEach, describe, expect, it, vi } from 'vitest'

import { aulasApi, descargarReporte } from './api'
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
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('solicita y adjunta el token CSRF en cambios de datos', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ csrf_token: 'token-de-prueba' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await aulasApi.remove(4)

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/login/csrf', { credentials: 'include' })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/aulas/4',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
        headers: expect.objectContaining({ 'X-CSRF-Token': 'token-de-prueba' }),
      }),
    )
  })

  it('conecta los módulos que usan relaciones académicas', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ total: 0, pagina_actual: 1, limite: 100, total_paginas: 0, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    await matriculasApi.list()
    await calificacionesApi.list()
    expect(fetchMockPaths()).toEqual(['/api/matriculas/?pagina_actual=1&limite=100', '/api/calificaciones/?pagina_actual=1&limite=100'])
  })
})

describe('descargarReporte', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    localStorage.clear()
  })

  it.each([
    ['csv', 'reporte_estudiantes.csv'],
    ['json', 'reporte_estudiantes.json'],
  ] as const)('descarga el archivo %s con nombre correcto', async (formato, nombreEsperado) => {
    vi.useFakeTimers()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('archivo de prueba', { status: 200, headers: { 'Content-Type': formato === 'csv' ? 'text/csv' : 'application/json' } }),
    )
    const crearUrl = vi.fn().mockReturnValue('blob:archivo-de-prueba')
    const revocarUrl = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: crearUrl, revokeObjectURL: revocarUrl })
    const nombresDescargados: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      nombresDescargados.push(this.download)
    })

    await descargarReporte('estudiantes', formato, { estado: 'ACTIVO' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reportes/estudiantes/descargar/' + formato + '?estado=ACTIVO',
      { credentials: 'include' },
    )
    expect(crearUrl).toHaveBeenCalledTimes(1)
    expect(crearUrl.mock.calls[0]?.[0]).toMatchObject({
      type: formato === 'csv' ? 'text/csv' : 'application/json',
      size: 'archivo de prueba'.length,
    })
    expect(nombresDescargados).toEqual([nombreEsperado])
    vi.runOnlyPendingTimers()
    expect(revocarUrl).toHaveBeenCalledWith('blob:archivo-de-prueba')
  })
})

function fetchMockPaths() { return vi.mocked(globalThis.fetch).mock.calls.map(([input]) => String(input)) }
