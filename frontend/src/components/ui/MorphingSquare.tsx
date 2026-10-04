interface MorphingSquareProps {
  message?: string
}

export function MorphingSquare({ message = 'Cargando...' }: MorphingSquareProps) {
  return (
    <div className="morphing-loader" role="status" aria-live="polite">
      <span className="morphing-loader__square" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
