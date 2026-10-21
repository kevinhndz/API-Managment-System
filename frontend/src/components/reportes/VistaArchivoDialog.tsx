import { Download, X } from 'lucide-react'
import { useEffect } from 'react'

import type { ReportFormat } from '../../services/api'

export interface ArchivoEnVista {
  titulo: string
  formato: ReportFormat
  url?: string
  texto?: string
}

export function VistaArchivoDialog({
  archivo,
  descargando,
  error,
  onClose,
  onDownload,
}: {
  archivo: ArchivoEnVista
  descargando: boolean
  error?: string
  onClose: () => void
  onDownload: () => void
}) {
  useEffect(() => {
    const alPresionar = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !descargando) onClose()
    }
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [descargando, onClose])

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`Vista previa de ${archivo.titulo}`}>
    <div className="flex h-[min(92vh,1000px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#fffdf8] shadow-2xl dark:bg-[#242033]">
      <header className="flex items-center justify-between gap-4 border-b px-5 py-4 dark:border-white/10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sage-700 dark:text-sage-400">Vista previa antes de descargar</p>
          <h3 className="mt-1 text-lg font-semibold text-navy-950 dark:text-white">{archivo.titulo} · {archivo.formato.toUpperCase()}</h3>
        </div>
        <button type="button" onClick={onClose} disabled={descargando} aria-label="Cerrar vista previa" className="focus-ring rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
      </header>
      <div className="min-h-0 flex-1 bg-slate-100 p-3 dark:bg-[#191625] sm:p-5">
        {archivo.url ? <iframe title={`Archivo ${archivo.titulo}`} src={archivo.url} className="h-full w-full rounded-lg border bg-white" sandbox={archivo.formato === 'xlsx' ? '' : undefined} /> :
          <pre className="h-full w-full overflow-auto rounded-lg border bg-white p-5 text-xs leading-relaxed text-slate-800 sm:text-sm">{archivo.texto}</pre>}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 dark:border-white/10">
        <div><p className="text-xs text-slate-500">Revisa el contenido. El archivo se generara al confirmar.</p>{error && <p role="alert" className="mt-1 text-xs font-semibold text-red-700">{error}</p>}</div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={descargando} className="focus-ring rounded-lg border px-4 py-2 text-sm font-semibold dark:border-white/20">Cancelar</button>
          <button type="button" onClick={onDownload} disabled={descargando} className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[#5b0309] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Download className="h-4 w-4" />{descargando ? 'Descargando...' : 'Confirmar descarga'}</button>
        </div>
      </footer>
    </div>
  </div>
}
