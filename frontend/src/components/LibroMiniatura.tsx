const posiciones = [
  { x: '0%', y: '0%' },
  { x: '50%', y: '0%' },
  { x: '100%', y: '0%' },
  { x: '0%', y: '100%' },
  { x: '50%', y: '100%' },
  { x: '100%', y: '100%' },
]

export function LibroMiniatura({ id }: { id: number }) {
  const posicion = posiciones[Math.abs(id) % posiciones.length]

  return <span
    aria-hidden="true"
    className="h-10 w-[27px] shrink-0 rounded-[4px] bg-white bg-no-repeat shadow-sm ring-1 ring-black/10"
    style={{
      backgroundImage: "url('/images/libros-asignaturas.png')",
      backgroundSize: '300% 200%',
      backgroundPosition: `${posicion.x} ${posicion.y}`,
    }}
  />
}
