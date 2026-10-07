import { useCallback, useState } from 'react'
import { IdCard } from 'lucide-react'

import { EntityPage, StatusBadge } from '../components/crud/EntityPage'
import { PersonCarnetDialog, type PersonCarnetData } from '../components/people/PersonCarnetDialog'
import { docentesApi } from '../services/api'
import type { Docente, DocentePayload } from '../types/api'

const emptyDocente: DocentePayload = {
  numero_empleado: '',
  nombres: '',
  apellidos: '',
  correo: '',
  estado: true,
}

export function DocentesPage() {
  const [carnet, setCarnet] = useState<PersonCarnetData | null>(null)
  const closeCarnet = useCallback(() => setCarnet(null), [])

  return (
    <>
      <EntityPage<Docente, DocentePayload>
        title="Docentes"
        singular="Docente"
        newLabel="Nuevo docente"
        description="Administra el directorio y estado del personal docente."
        service={docentesApi}
        emptyPayload={emptyDocente}
        toPayload={({ numero_empleado, nombres, apellidos, correo, estado }) => ({ numero_empleado, nombres, apellidos, correo, estado })}
        searchableText={(docente) => `${docente.numero_empleado} ${docente.nombres} ${docente.apellidos} ${docente.correo}`}
        columns={[
          { label: 'Empleado', render: (docente) => <strong className="font-semibold text-slate-800 dark:text-slate-100">{docente.numero_empleado}</strong> },
          { label: 'Nombre', render: (docente) => `${docente.nombres} ${docente.apellidos}` },
          { label: 'Correo', render: (docente) => <a className="text-sage-600 hover:underline dark:text-sage-400" href={`mailto:${docente.correo}`}>{docente.correo}</a> },
          { label: 'Estado', render: (docente) => <StatusBadge active={docente.estado} /> },
        ]}
        fields={[
          { key: 'numero_empleado', label: 'Número de empleado', placeholder: 'Ej. DOC-001' },
          { key: 'nombres', label: 'Nombres', placeholder: 'Nombres' },
          { key: 'apellidos', label: 'Apellidos', placeholder: 'Apellidos' },
          { key: 'correo', label: 'Correo electrónico', type: 'email', placeholder: 'docente@campus.edu' },
          { key: 'estado', label: 'Docente activo', type: 'checkbox' },
        ]}
        statusOptions={[{ value: 'activo', label: 'Activos' }, { value: 'inactivo', label: 'Inactivos' }]}
        rowAction={(docente) => ({
          label: 'Ver carnet',
          icon: <IdCard className="h-4 w-4" />,
          onSelect: () => setCarnet({
            name: `${docente.nombres} ${docente.apellidos}`,
            code: docente.numero_empleado,
            codeLabel: 'Número de empleado',
            email: docente.correo,
            status: docente.estado ? 'Activo' : 'Inactivo',
            typeLabel: 'Identificación docente',
            areaLabel: 'Vinculación institucional',
            area: 'Personal docente',
          }),
        })}
      />
      {carnet && <PersonCarnetDialog person={carnet} onClose={closeCarnet} />}
    </>
  )
}
