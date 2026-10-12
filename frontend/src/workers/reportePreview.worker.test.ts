import { afterEach, expect, it, vi } from 'vitest'
import type { SolicitudVistaPrevia } from './reportePreview.types'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

it('cancela la consulta anterior y entrega solo el resultado vigente', async () => {
  const hilo = { addEventListener: vi.fn(), postMessage: vi.fn() }
  vi.stubGlobal('self', hilo)

  let resolverPrimera!: (respuesta: Response) => void
  const fetchMock = vi.fn()
    .mockImplementationOnce(() => new Promise<Response>((resolve) => { resolverPrimera = resolve }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ modulo: 'estudiantes', total_registros: 1, columnas: [], registros: [] }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  await import('./reportePreview.worker')
  const recibir = hilo.addEventListener.mock.calls[0][1] as (evento: MessageEvent<SolicitudVistaPrevia>) => Promise<void>

  const primera = recibir({ data: { id: 1, modulo: 'estudiantes', filtros: { estado: 'ACTIVO' } } } as MessageEvent<SolicitudVistaPrevia>)
  const primeraSenal = fetchMock.mock.calls[0][1].signal as AbortSignal
  await recibir({ data: { id: 2, modulo: 'estudiantes', filtros: { estado: 'INACTIVO' } } } as MessageEvent<SolicitudVistaPrevia>)
  resolverPrimera(new Response(JSON.stringify({ modulo: 'estudiantes', total_registros: 2, columnas: [], registros: [] }), { status: 200 }))
  await primera

  expect(primeraSenal.aborted).toBe(true)
  expect(fetchMock.mock.calls[1][0]).toContain('estado=INACTIVO')
  expect(hilo.postMessage).toHaveBeenCalledTimes(1)
  expect(hilo.postMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 2, estado: 'completada' }))
})
