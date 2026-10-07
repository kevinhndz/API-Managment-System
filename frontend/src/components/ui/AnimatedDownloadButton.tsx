import { ArrowDownToLine, LoaderCircle } from 'lucide-react'

interface AnimatedDownloadButtonProps {
  label: string
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}

export function AnimatedDownloadButton({
  label,
  loading = false,
  disabled = false,
  onClick,
}: AnimatedDownloadButtonProps) {
  const accessibleLabel = loading ? `Generando ${label}` : `Descargar ${label}`

  return (
    <button
      className={`animated-download-button${loading ? ' is-loading' : ''}`}
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={accessibleLabel}
      aria-busy={loading}
    >
      <span className="animated-download-button__icon" aria-hidden="true">
        {loading ? <LoaderCircle /> : <ArrowDownToLine />}
      </span>
      <span className="animated-download-button__label">
        {loading ? 'Generando…' : accessibleLabel}
      </span>
    </button>
  )
}
