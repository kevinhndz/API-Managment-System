import type { ResultadoVistaPrevia, SolicitudVistaPrevia, VistaPreviaReporte } from './reportePreview.types'

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')
let consultaActual: AbortController | null = null

self.addEventListener('message', async (event: MessageEvent<SolicitudVistaPrevia>) => {
  consultaActual?.abort()
  const control = new AbortController()
  consultaActual = control
  const { id, modulo, filtros, institucion } = event.data
  const parametros = new URLSearchParams()

  Object.entries(filtros).forEach(([campo, valor]) => {
    if (valor !== undefined && valor !== '') parametros.set(campo, String(valor))
  })

  try {
    const respuesta = await fetch(`${API_URL}/reportes/${modulo}/vista-previa?${parametros}`, {
      credentials: 'include',
      headers: { 'X-Institution-Slug': institucion },
      signal: control.signal,
    })
    if (!respuesta.ok) {
      const error = (await respuesta.json().catch(() => null)) as { detail?: string } | null
      const resultado: ResultadoVistaPrevia = {
        id,
        estado: 'error',
        codigo: respuesta.status,
        mensaje: error?.detail ?? 'No se pudo consultar el reporte.',
      }
      self.postMessage(resultado)
      return
    }

    const datos = await respuesta.json() as VistaPreviaReporte
    if (!control.signal.aborted) {
      const resultado: ResultadoVistaPrevia = { id, estado: 'completada', datos }
      self.postMessage(resultado)
    }
  } catch (error) {
    if (control.signal.aborted) return
    const resultado: ResultadoVistaPrevia = {
      id,
      estado: 'error',
      codigo: 0,
      mensaje: error instanceof Error ? error.message : 'No se pudo consultar el reporte.',
    }
    self.postMessage(resultado)
  } finally {
    if (consultaActual === control) consultaActual = null
  }
})
