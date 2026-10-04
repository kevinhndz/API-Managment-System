interface HexagonBackgroundProps {
  className?: string
}

export function HexagonBackground({ className = '' }: HexagonBackgroundProps) {
  return <div className={`hexagon-background ${className}`} aria-hidden="true" />
}
