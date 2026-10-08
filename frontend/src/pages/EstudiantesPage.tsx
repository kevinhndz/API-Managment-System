import { useCallback, useState } from 'react'
import { IdCard } from 'lucide-react'

import { EntityPage, StatusBadge } from '../components/crud/EntityPage'
import { PersonCarnetDialog, type PersonCarnetData } from '../components/people/PersonCarnetDialog'
import { FolderFloat } from '../components/ui/FolderFloat'
import { estudiantesApi } from '../services/api'
import type { Estudiante, EstudiantePayload } from '../types/api'
import { useAcademicLabels } from '../hooks/useAcademicLabels'
import { useAuth } from '../contexts/AuthContext'

const empty: EstudiantePayload = { cuenta: '', nombre: '', correo: '', telefono: '', fechaNacimiento: '2000-01-01', carrera_id: 1, estado: true }

export function EstudiantesPage() {
  const labels = useAcademicLabels()
  const { user } = useAuth()
  const esAdministrador = ['admin', 'administrador'].includes(user?.role.toLocaleLowerCase('es') ?? '')
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
        canCreate={esAdministrador}
        canEdit
        canDelete={esAdministrador}
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
        renderActions={(_, handlers) => (
          <FolderFloat
            items={[
              { label: 'Ver carnet', value: 'carnet' },
              ...(esAdministrador ? [
                { label: 'Editar', value: 'editar' },
                { label: 'Eliminar', value: 'eliminar' },
              ] : [
                { label: 'Editar', value: 'editar' },
              ]),
            ]}
            label="Acciones"
            sublabel="3 opciones"
            trigger="hover"
            closeOnSelect
            physics
            folderColor="#5b0309"
            frontColor="#8f1721"
            paperColor="#fff8f4"
            itemColor="#fff4f2"
            itemTextColor="#351215"
            labelColor="#fff8f4"
            width={92}
            height={28}
            spread={104}
            lift={12}
            radius={9}
            className="folder-float--compact"
            onSelect={(value) => {
              if (value === 'carnet') handlers.onExtraAction?.()
              if (value === 'editar') handlers.onEdit()
              if (value === 'eliminar') handlers.onDelete()
            }}
          />
        )}
      />
      {carnet && <PersonCarnetDialog person={carnet} onClose={closeCarnet} />}
    </>
  )
}
