export function formatearImporte(importe: string | null | undefined, moneda: string | null | undefined) {
  if (!importe || !moneda) return 'No disponible'
  const entero = Number(importe)
  if (!Number.isFinite(entero)) return 'No disponible'
  try {
    const formato = new Intl.NumberFormat('es-HN', { style: 'currency', currency: moneda })
    const decimales = formato.resolvedOptions().maximumFractionDigits ?? 2
    return formato.format(entero / 10 ** decimales)
  } catch { return 'No disponible' }
}
