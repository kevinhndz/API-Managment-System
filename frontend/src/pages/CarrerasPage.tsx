import { EntityPage, StatusBadge } from '../components/crud/EntityPage'
import { carrerasApi } from '../services/api'
import type { Carrera, CarreraPayload } from '../types/api'

const emptyCarrera: CarreraPayload = {
  codigo: '',
  nombre: '',
  duracion_anios: 4,
  activo: true,
}

export function CarrerasPage() {
  return (
    <EntityPage<Carrera, CarreraPayload>
      title="Carreras"
      singular="Carrera"
      newLabel="Nueva carrera"
      description="Organiza la oferta académica y duración de los programas."
      service={carrerasApi}
      emptyPayload={emptyCarrera}
      toPayload={({ codigo, nombre, duracion_anios, activo }) => ({ codigo, nombre, duracion_anios, activo })}
      searchableText={(carrera) => `${carrera.codigo} ${carrera.nombre}`}
      columns={[
        { label: 'Código', render: (carrera) => <strong className="font-semibold text-slate-800 dark:text-slate-100">{carrera.codigo}</strong> },
        { label: 'Nombre', render: (carrera) => carrera.nombre },
        { label: 'Duración', render: (carrera) => `${carrera.duracion_anios} ${carrera.duracion_anios === 1 ? 'año' : 'años'}` },
        { label: 'Estado', render: (carrera) => <StatusBadge active={carrera.activo} /> },
      ]}
      fields={[
        { key: 'codigo', label: 'Código', placeholder: 'Ej. IS-01' },
        { key: 'nombre', label: 'Nombre de la carrera', placeholder: 'Ej. Ingeniería en Sistemas' },
        { key: 'duracion_anios', label: 'Duración en años', type: 'number', min: 1, max: 10 },
        { key: 'activo', label: 'Carrera activa', type: 'checkbox' },
      ]}
      statusOptions={[{ value: 'activo', label: 'Activas' }, { value: 'inactivo', label: 'Inactivas' }]}
    />
  )
}
