interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  return <span className={`block animate-pulse rounded-lg bg-slate-200/80 dark:bg-stone-800 ${className}`} aria-hidden="true">{lines > 1 && <span className="sr-only">Cargando contenido</span>}</span>
}

export function TableSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return <div className="space-y-3" role="status" aria-label="Cargando registros">{Array.from({ length: rows }, (_, row) => <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} key={row}>{Array.from({ length: columns }, (_, column) => <Skeleton className="h-4" key={column} />)}</div>)}<span className="sr-only">Cargando registros</span></div>
}
