interface ClassroomCapacityChartProps {
  aulas: { codigo: string; capacidad: number }[]
}

export function ClassroomCapacityChart({ aulas }: ClassroomCapacityChartProps) {
  const maximum = Math.max(1, ...aulas.map((aula) => aula.capacidad))
  const scale = Math.ceil(maximum / 10) * 10
  return <article className="academic-capacity-chart">
    <h2>Capacidad por aula</h2><p>Aforo máximo en las 8 aulas con mayor capacidad</p>
    {!aulas.length ? <p className="academic-empty">No hay capacidad registrada para graficar.</p> : <>
      <ul aria-label="Capacidad de las aulas">{aulas.slice(0, 8).map((aula) => <li key={aula.codigo}>
        <span>{aula.codigo}</span><span className="academic-capacity-track"><span style={{ width: `${aula.capacidad / scale * 100}%` }} /></span><span>{aula.capacidad} cupos</span>
      </li>)}</ul>
      <div className="academic-capacity-axis" aria-hidden="true">{[0, 1, 2, 3, 4].map((tick) => <span key={tick}>{Math.round(scale * tick / 4)}{tick === 4 ? ' plazas' : ''}</span>)}</div>
    </>}
  </article>
}
