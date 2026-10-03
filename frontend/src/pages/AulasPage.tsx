import { EntityPage, StatusBadge } from '../components/crud/EntityPage'
import { aulasApi } from '../services/api'
import type { Aula, AulaPayload } from '../types/api'

const emptyAula: AulaPayload = {
  codigo: '',
  edificio: 'Edificio Norte',
  capacidad: 20,
  activo: true,
}

export function AulasPage() {
  return (
    <EntityPage<Aula, AulaPayload>
      title="Aulas"
      singular="Aula"
      newLabel="Nueva aula"
      description="Gestiona espacios, capacidad y disponibilidad del campus."
      service={aulasApi}
      emptyPayload={emptyAula}
      toPayload={({ codigo, edificio, capacidad, activo }) => ({ codigo, edificio, capacidad, activo })}
      searchableText={(aula) => `${aula.codigo} ${aula.edificio}`}
      columns={[
        { label: 'Código', render: (aula) => <strong className="font-semibold text-slate-800 dark:text-slate-100">{aula.codigo}</strong> },
        { label: 'Edificio', render: (aula) => aula.edificio },
        { label: 'Capacidad', render: (aula) => `${aula.capacidad} personas` },
        { label: 'Estado', render: (aula) => <StatusBadge active={aula.activo} /> },
      ]}
      fields={[
        { key: 'codigo', label: 'Código', placeholder: 'Ej. A-204' },
        {
          key: 'edificio',
          label: 'Edificio',
          type: 'select',
          options: [
            { label: 'Edificio Norte', value: 'Edificio Norte' },
            { label: 'Edificio Sur', value: 'Edificio Sur' },
            { label: 'Edificio UPH', value: 'Edificio UPH' },
          ],
        },
        { key: 'capacidad', label: 'Capacidad', type: 'number', min: 20, max: 65 },
        { key: 'activo', label: 'Aula activa', type: 'checkbox' },
      ]}
    />
  )
}
