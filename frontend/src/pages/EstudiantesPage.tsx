import { useCallback, useState } from 'react'
import { IdCard } from 'lucide-react'

import { EntityPage, StatusBadge } from '../components/crud/EntityPage'
import { PersonCarnetDialog, type PersonCarnetData } from '../components/people/PersonCarnetDialog'
import { estudiantesApi } from '../services/api'
import type { Estudiante, EstudiantePayload } from '../types/api'
import { useAcademicLabels } from '../hooks/useAcademicLabels'

const empty: EstudiantePayload = { cuenta: '', nombre: '', correo: '', telefono: '', fechaNacimiento: '2000-01-01', carrera_id: 1, estado: true }

export function EstudiantesPage() {
  const labels = useAcademicLabels()
  const [carnet, setCarnet] = useState<PersonCarnetData | null>(null)
  const closeCarnet = useCallback(() => setCarnet(null), [])

  return (
    <>
      <EntityPage<Estudiante, EstudiantePayload>
        title="Estudiantes"
        singular="Estudiante"
        newLabel="Nuevo estudiante"
        description="Administra el registro y estado del estudiantado."
        service={estudiantesApi}
        emptyPayload={empty}
        toPayload={(item) => ({ cuenta: item.cuenta, nombre: item.nombre, correo: item.correo, telefono: item.telefono, fechaNacimiento: item.fechaNacimiento, carrera_id: item.carrera_id, estado: item.estado })}
        searchableText={(item) => `${item.cuenta} ${item.nombre} ${item.correo} ${labels.carreras[item.carrera_id] ?? ''}`}
        columns={[
          { label: 'Cuenta', render: (item) => <strong>{item.cuenta}</strong> },
          { label: 'Nombre', render: (item) => item.nombre },
          { label: 'Correo', render: (item) => item.correo },
          { label: 'Carrera', render: (item) => labels.carreras[item.carrera_id] ?? `Carrera #${item.carrera_id}` },
          { label: 'Estado', render: (item) => <StatusBadge active={item.estado} /> },
        ]}
        fields={[
          { key: 'cuenta', label: 'Cuenta' },
          { key: 'nombre', label: 'Nombre' },
          { key: 'correo', label: 'Correo electrónico', type: 'email' },
          { key: 'telefono', label: 'Teléfono' },
          { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' },
          { key: 'carrera_id', label: 'Carrera', type: 'select', valueType: 'number', options: labels.carreraOptions },
          { key: 'estado', label: 'Estudiante activo', type: 'checkbox' },
        ]}
        statusOptions={[{ value: 'activo', label: 'Activos' }, { value: 'inactivo', label: 'Inactivos' }]}
        rowAction={(item) => ({
          label: 'Ver carnet',
          icon: <IdCard className="h-4 w-4" />,
          onSelect: () => setCarnet({
            name: item.nombre,
            code: item.cuenta,
            codeLabel: 'Número de cuenta',
            email: item.correo,
            phone: item.telefono,
            status: item.estado ? 'Activo' : 'Inactivo',
            typeLabel: 'Identificación estudiantil',
            areaLabel: 'Carrera',
            area: labels.carreras[item.carrera_id] ?? `Carrera #${item.carrera_id}`,
          }),
        })}
      />
      {carnet && <PersonCarnetDialog person={carnet} onClose={closeCarnet} />}
    </>
  )
}
