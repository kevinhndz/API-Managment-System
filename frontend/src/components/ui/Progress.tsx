interface ProgressProps {
  value?: number
  label?: string
}

export function Progress({ value, label = 'Cargando información...' }: ProgressProps) {
  const boundedValue = value === undefined ? undefined : Math.min(100, Math.max(0, value))
  return <div className="progress-status" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={boundedValue}>
    <div className="flex items-center justify-between gap-4 text-sm font-semibold"><span>{label}</span><span className="text-xs font-medium text-slate-400">{boundedValue === undefined ? 'En curso' : `${boundedValue}%`}</span></div>
    <div className="progress-status__track"><span className={`progress-status__bar ${boundedValue === undefined ? 'is-indeterminate' : ''}`} style={boundedValue === undefined ? undefined : { width: `${boundedValue}%` }} /></div>
  </div>
}
