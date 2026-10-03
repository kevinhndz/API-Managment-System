interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="rounded-2xl border bg-white p-8 shadow-panel dark:bg-slate-900">
      <p className="text-sm font-semibold text-sage-600 dark:text-sage-400">Módulo académico</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950 dark:text-white">{title}</h2>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </section>
  )
}
