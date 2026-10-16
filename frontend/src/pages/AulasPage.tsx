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
      filters={[
        { key: 'edificio', label: 'Edificio', options: [{ value: 'Edificio Norte', label: 'Edificio Norte' }, { value: 'Edificio Sur', label: 'Edificio Sur' }, { value: 'Edificio UPH', label: 'Edificio UPH' }], getValue: (aula) => aula.edificio },
        { key: 'capacidad', label: 'Capacidad', options: [{ value: 'small', label: 'Hasta 30 personas' }, { value: 'medium', label: '31–45 personas' }, { value: 'large', label: '46 o más personas' }], getValue: (aula) => aula.capacidad <= 30 ? 'small' : aula.capacidad <= 45 ? 'medium' : 'large' },
      ]}
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
      statusOptions={[{ value: 'activo', label: 'Activas' }, { value: 'inactivo', label: 'Inactivas' }]}
    />
  )
}
