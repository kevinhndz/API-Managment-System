import { useEffect, useState } from 'react'
import { UsersRound } from 'lucide-react'

import { EntityPage, StatusBadge } from '../components/crud/EntityPage'
import { ActionMenu } from '../components/ui/ActionMenu'
import { Modal } from '../components/ui/Modal'
import { asignaturasApi, listarEstudiantesAsignatura, type EstudianteAsignatura } from '../services/api'
import type { Asignatura, AsignaturaPayload } from '../types/api'
import { useAcademicLabels } from '../hooks/useAcademicLabels'

const empty: AsignaturaPayload = { codigo: '', nombre: '', unidades_valorativas: 3, carrera_id: 1, requisito_id: null, activo: true }

export function AsignaturasPage() {
  const labels = useAcademicLabels()
  const [seleccionada, setSeleccionada] = useState<Asignatura | null>(null)
  const [periodoId, setPeriodoId] = useState('')
  const [estudiantes, setEstudiantes] = useState<EstudianteAsignatura[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!seleccionada) return
    let activo = true
    setCargando(true)
    setError('')
    void listarEstudiantesAsignatura(seleccionada.id, periodoId ? Number(periodoId) : undefined)
      .then((datos) => { if (activo) setEstudiantes(datos) })
      .catch((motivo: unknown) => { if (activo) setError(motivo instanceof Error ? motivo.message : 'No se pudieron consultar los estudiantes.') })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [seleccionada, periodoId])

  return <>
    <EntityPage<Asignatura, AsignaturaPayload>
      title="Asignaturas" singular="Asignatura" newLabel="Nueva asignatura"
      description="Administra el plan academico y consulta los estudiantes de cada asignatura."
      service={asignaturasApi} emptyPayload={empty}
      toPayload={(item) => ({ codigo: item.codigo, nombre: item.nombre, unidades_valorativas: item.unidades_valorativas, carrera_id: item.carrera_id, requisito_id: item.requisito_id, activo: item.activo })}
      searchableText={(item) => `${item.codigo} ${item.nombre} ${labels.carreras[item.carrera_id] ?? ''}`}
      filters={[
        { key: 'carrera', label: 'Carrera', options: labels.carreraOptions, getValue: (item) => item.carrera_id },
        { key: 'unidades', label: 'Unidades', options: [{ value: 'low', label: '1-3 unidades' }, { value: 'mid', label: '4-6 unidades' }, { value: 'high', label: '7 o mas' }], getValue: (item) => item.unidades_valorativas <= 3 ? 'low' : item.unidades_valorativas <= 6 ? 'mid' : 'high' },
      ]}
      columns={[
        { label: 'Codigo', render: (item) => <strong>{item.codigo}</strong> },
        { label: 'Nombre', render: (item) => item.nombre },
        { label: 'Unidades', render: (item) => item.unidades_valorativas },
        { label: 'Carrera', render: (item) => labels.carreras[item.carrera_id] ?? `Carrera #${item.carrera_id}` },
        { label: 'Estado', render: (item) => <StatusBadge active={item.activo} /> },
      ]}
      fields={[
        { key: 'codigo', label: 'Codigo' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'unidades_valorativas', label: 'Unidades valorativas', type: 'number', min: 1, max: 20 },
        { key: 'carrera_id', label: 'Carrera', type: 'select', valueType: 'number', options: labels.carreraOptions },
        { key: 'requisito_id', label: 'Requisito', type: 'select', valueType: 'number', options: [{ label: 'Sin requisito', value: '' }, ...labels.asignaturaOptions], required: false },
        { key: 'activo', label: 'Asignatura activa', type: 'checkbox' },
      ]}
      statusOptions={[{ value: 'activo', label: 'Activas' }, { value: 'inactivo', label: 'Inactivas' }]}
      renderActions={(item, handlers) => <div className="flex items-center justify-end gap-2">
        <button type="button" className="focus-ring inline-flex h-9 items-center gap-1 rounded-lg border px-2 text-xs font-semibold" onClick={() => { setPeriodoId(''); setEstudiantes([]); setSeleccionada(item) }}><UsersRound className="h-4 w-4" /> Ver estudiantes</button>
        <ActionMenu singular="Asignatura" onEdit={handlers.onEdit} onDelete={handlers.onDelete} />
      </div>}
    />
    <Modal open={seleccionada !== null} title={`Estudiantes de ${seleccionada?.codigo ?? ''}`} description={seleccionada?.nombre} onClose={() => setSeleccionada(null)}>
      <div className="space-y-4 p-6">
        <label className="block text-sm font-medium">Periodo
          <select className="focus-ring mt-1 h-10 w-full rounded-xl border bg-white px-3 dark:border-white/10 dark:bg-[#191625]" value={periodoId} onChange={(event) => setPeriodoId(event.target.value)}>
            <option value="">Todos los periodos</option>
            {(labels.periodoOptions ?? []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {cargando ? <p role="status" className="text-sm text-slate-500">Consultando estudiantes...</p> : <>
          <p className="text-sm text-slate-500">{estudiantes.length} matriculas encontradas</p>
          {estudiantes.length === 0 ? <p className="text-sm text-slate-500">No hay estudiantes matriculados en esta asignatura para el periodo elegido.</p> : <div className="max-h-[55vh] overflow-auto rounded-xl border dark:border-white/10"><table className="w-full min-w-[540px] text-left text-sm"><thead className="sticky top-0 bg-[#faf7f0] dark:bg-[#302a43]"><tr><th className="px-3 py-2">Cuenta</th><th className="px-3 py-2">Estudiante</th><th className="px-3 py-2">Seccion</th><th className="px-3 py-2">Periodo</th><th className="px-3 py-2">Estado</th></tr></thead><tbody>{estudiantes.map((item, index) => <tr key={`${item.cuenta}-${item.seccion}-${item.anio}-${item.periodo}-${index}`} className="border-t dark:border-white/10"><td className="px-3 py-2">{item.cuenta}</td><td className="px-3 py-2">{item.estudiante}</td><td className="px-3 py-2">{item.seccion}</td><td className="px-3 py-2">{item.anio}-{item.periodo}</td><td className="px-3 py-2">{item.estado}</td></tr>)}</tbody></table></div>}
        </>}
      </div>
    </Modal>
  </>
}
