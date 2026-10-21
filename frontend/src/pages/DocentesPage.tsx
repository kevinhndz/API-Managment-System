import { useCallback, useState } from 'react'
import { FileText, IdCard } from 'lucide-react'

import { EntityPage, StatusBadge } from '../components/crud/EntityPage'
import { PersonCarnetDialog, type PersonCarnetData } from '../components/people/PersonCarnetDialog'
import { ActionMenu } from '../components/ui/ActionMenu'
import { descargarDocumento, docentesApi } from '../services/api'
import type { Docente, DocentePayload } from '../types/api'

const emptyDocente: DocentePayload = {
  numero_empleado: '',
  nombres: '',
  apellidos: '',
  correo: '',
  especialidad: '',
  cargo: null,
  departamento: null,
  tipo_contrato: null,
  fecha_ingreso: null,
  estado: true,
}

export function DocentesPage() {
  const [carnet, setCarnet] = useState<PersonCarnetData | null>(null)
  const [errorDocumento, setErrorDocumento] = useState('')
  const closeCarnet = useCallback(() => setCarnet(null), [])

  return (
    <>
      {errorDocumento && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorDocumento}</p>}
      <EntityPage<Docente, DocentePayload>
        title="Docentes"
        singular="Docente"
        newLabel="Nuevo docente"
        description="Administra el directorio y estado del personal docente."
        service={docentesApi}
        emptyPayload={emptyDocente}
        toPayload={({ numero_empleado, nombres, apellidos, correo, especialidad, cargo, departamento, tipo_contrato, fecha_ingreso, estado }) => ({ numero_empleado, nombres, apellidos, correo, especialidad, cargo, departamento, tipo_contrato, fecha_ingreso, estado })}
        searchableText={(docente) => `${docente.numero_empleado} ${docente.nombres} ${docente.apellidos} ${docente.correo}`}
        columns={[
          { label: 'Empleado', render: (docente) => <strong className="font-semibold text-slate-800 dark:text-slate-100">{docente.numero_empleado}</strong> },
          { label: 'Nombre', render: (docente) => <span className="flex items-center gap-2"><img className="h-8 w-8 rounded-full object-cover" src={docente.foto ?? `/avatars/persona-${String((docente.id - 1) % 12 + 1).padStart(2, '0')}.jpg`} alt="" />{docente.nombres} {docente.apellidos}</span> },
          { label: 'Correo', render: (docente) => <a className="text-sage-600 hover:underline dark:text-sage-400" href={`mailto:${docente.correo}`}>{docente.correo}</a> },
          { label: 'Estado', render: (docente) => <StatusBadge active={docente.estado} /> },
        ]}
        fields={[
          { key: 'numero_empleado', label: 'Número de empleado', placeholder: 'Ej. DOC-001' },
          { key: 'nombres', label: 'Nombres', placeholder: 'Nombres' },
          { key: 'apellidos', label: 'Apellidos', placeholder: 'Apellidos' },
          { key: 'correo', label: 'Correo electrónico', type: 'email', placeholder: 'docente@campus.edu' },
          { key: 'especialidad', label: 'Especialidad', placeholder: 'Ej. Matematicas' },
          { key: 'cargo', label: 'Cargo', placeholder: 'Ej. Docente titular', required: false },
          { key: 'departamento', label: 'Departamento', placeholder: 'Ej. Ciencias basicas', required: false },
          { key: 'tipo_contrato', label: 'Tipo de contrato', placeholder: 'Ej. Tiempo completo', required: false },
          { key: 'fecha_ingreso', label: 'Fecha de ingreso', type: 'date', required: false },
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
        renderActions={(docente, handlers) => (
          <div className="flex items-center justify-end gap-2">
            <button type="button" className="focus-ring inline-flex h-9 items-center gap-1 rounded-lg border px-2 text-xs font-semibold" onClick={() => {
              setErrorDocumento('')
              void descargarDocumento('constancia-laboral', docente.id).catch((error: unknown) => {
                setErrorDocumento(error instanceof Error ? error.message : 'No se pudo emitir la constancia.')
              })
            }}><FileText className="h-4 w-4" /> Constancia</button>
            <ActionMenu singular="Docente" onEdit={handlers.onEdit} onDelete={handlers.onDelete} extraAction={{ label: 'Ver carnet', icon: <IdCard className="h-4 w-4" />, onSelect: () => handlers.onExtraAction?.() }} />
          </div>
        )}
      />
      {carnet && <PersonCarnetDialog person={carnet} onClose={closeCarnet} />}
    </>
  )
}
