interface ClassroomDistributionChartProps {
  buildings: { nombre: string; aulas_activas: number; aulas_totales: number; ocupacion: number | null; capacidad: number }[]
}

export function ClassroomDistributionChart({ buildings }: ClassroomDistributionChartProps) {
  const total = buildings.reduce((sum, building) => sum + building.aulas_activas, 0)
  return <article className="academic-building-table">
    <h2>Distribución por edificio</h2><p>Ocupación y espacios asignados en secciones abiertas</p>
    <div className="overflow-x-auto"><table>
      <thead><tr><th scope="col">Edificio</th><th scope="col">Aulas activas</th><th scope="col">Ocupación</th></tr></thead>
      <tbody>{buildings.map((building) => <tr key={building.nombre}><th scope="row">{building.nombre}</th><td>{building.aulas_activas} aulas</td><td>{building.ocupacion === null ? 'Sin secciones abiertas' : `${building.ocupacion}% de ocupación`}</td></tr>)}</tbody>
    </table></div>
    {!buildings.length && <p className="academic-empty">No hay aulas registradas.</p>}
    <footer><strong>Total: {total} aulas activas</strong><span>{buildings.length} edificios registrados</span></footer>
  </article>
}
