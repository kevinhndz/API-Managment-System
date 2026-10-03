import { EntityPage, StatusBadge } from '../components/crud/EntityPage'
import { docentesApi } from '../services/api'
import type { Docente, DocentePayload } from '../types/api'

const emptyDocente: DocentePayload = {
  numero_empleado: '',
  nombres: '',
  apellidos: '',
  correo: '',
  especialidad: '',
  estado: true,
}

export function DocentesPage() {
  return (
    <EntityPage<Docente, DocentePayload>
      title="Docentes"
      singular="Docente"
      newLabel="Nuevo docente"
      description="Administra el directorio y estado del personal docente."
      service={docentesApi}
      emptyPayload={emptyDocente}
      toPayload={({ numero_empleado, nombres, apellidos, correo, especialidad, estado }) => ({ numero_empleado, nombres, apellidos, correo, especialidad, estado })}
      searchableText={(docente) => `${docente.numero_empleado} ${docente.nombres} ${docente.apellidos} ${docente.correo} ${docente.especialidad}`}
      columns={[
        { label: 'Empleado', render: (docente) => <strong className="font-semibold text-slate-800 dark:text-slate-100">{docente.numero_empleado}</strong> },
        { label: 'Nombre', render: (docente) => `${docente.nombres} ${docente.apellidos}` },
        { label: 'Especialidad', render: (docente) => docente.especialidad },
        { label: 'Correo', render: (docente) => <a className="text-sage-600 hover:underline dark:text-sage-400" href={`mailto:${docente.correo}`}>{docente.correo}</a> },
        { label: 'Estado', render: (docente) => <StatusBadge active={docente.estado} /> },
      ]}
      fields={[
        { key: 'numero_empleado', label: 'Número de empleado', placeholder: 'Ej. DOC-001' },
        { key: 'especialidad', label: 'Especialidad', placeholder: 'Ej. Matemáticas' },
        { key: 'nombres', label: 'Nombres', placeholder: 'Nombres' },
        { key: 'apellidos', label: 'Apellidos', placeholder: 'Apellidos' },
        { key: 'correo', label: 'Correo electrónico', type: 'email', placeholder: 'docente@campus.edu' },
        { key: 'estado', label: 'Docente activo', type: 'checkbox' },
      ]}
    />
  )
}
