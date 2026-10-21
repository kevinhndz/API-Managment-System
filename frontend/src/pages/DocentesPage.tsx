import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, IdCard } from 'lucide-react'

import { EntityPage, StatusBadge } from '../components/crud/EntityPage'
import { PersonCarnetDialog, type PersonCarnetData } from '../components/people/PersonCarnetDialog'
import { ActionMenu } from '../components/ui/ActionMenu'
import { Modal } from '../components/ui/Modal'
import { listarCargaDocente, docentesApi, type CargaDocente } from '../services/api'
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
  const [carga, setCarga] = useState<CargaDocente[]>([])
  const [catalogoDocentes, setCatalogoDocentes] = useState<Docente[]>([])
  const [docenteCarga, setDocenteCarga] = useState<Docente | null>(null)
  const [errorCarga, setErrorCarga] = useState('')
  useEffect(() => { void listarCargaDocente().then(setCarga).catch(() => setErrorCarga('No se pudo consultar la carga docente.')) }, [])
  useEffect(() => {
    void docentesApi.list({ pagina_actual: 1, limite: 100 }).then(async (primera) => {
      const resto = await Promise.all(Array.from({ length: Math.max(0, primera.total_paginas - 1) }, (_, index) => docentesApi.list({ pagina_actual: index + 2, limite: 100 })))
      setCatalogoDocentes([...primera.data, ...resto.flatMap((pagina) => pagina.data)])
    }).catch(() => setErrorCarga('No se pudieron cargar todos los filtros docentes.'))
  }, [])
  const filtros = useMemo(() => [
    { key: 'contrato', label: 'Tipo de contrato', options: [...new Set(catalogoDocentes.map((item) => item.tipo_contrato).filter((item): item is string => Boolean(item)))].map((value) => ({ value, label: value })), getValue: (item: Docente) => item.tipo_contrato },
    { key: 'departamento', label: 'Departamento', options: [...new Set(catalogoDocentes.map((item) => item.departamento).filter((item): item is string => Boolean(item)))].map((value) => ({ value, label: value })), getValue: (item: Docente) => item.departamento },
    { key: 'asignatura', label: 'Asignatura', options: [...new Map(carga.map((item) => [item.asignatura_id, { value: String(item.asignatura_id), label: `${item.codigo_asignatura} · ${item.asignatura}` }])).values()], getValue: (item: Docente) => carga.filter((registro) => registro.docente_id === item.id).map((registro) => registro.asignatura_id) },
    { key: 'seccion', label: 'Seccion', options: [...new Set(carga.map((item) => item.seccion))].map((value) => ({ value, label: value })), getValue: (item: Docente) => carga.filter((registro) => registro.docente_id === item.id).map((registro) => registro.seccion) },
    { key: 'periodo', label: 'Periodo', options: [...new Map(carga.map((item) => [item.periodo_id, { value: String(item.periodo_id), label: `${item.anio} · periodo ${item.numero}` }])).values()], getValue: (item: Docente) => carga.filter((registro) => registro.docente_id === item.id).map((registro) => registro.periodo_id) },
    { key: 'secciones', label: 'Secciones actuales', options: [{ value: '0', label: 'Sin secciones' }, { value: '1', label: '1 seccion' }, { value: '2', label: '2 secciones' }, { value: '3', label: '3 o mas' }], getValue: (item: Docente) => { const total = carga.filter((registro) => registro.docente_id === item.id && registro.vigente).length; return total >= 3 ? 3 : total } },
  ], [carga, catalogoDocentes])
  const closeCarnet = useCallback(() => setCarnet(null), [])

  return (
    <>
      {errorCarga && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorCarga}</p>}
      <EntityPage<Docente, DocentePayload>
        title="Docentes"
        singular="Docente"
        newLabel="Nuevo docente"
        description="Consulta asignaturas, secciones, periodos y tipo de contrato de cada docente."
        filters={filtros}
        service={docentesApi}
        emptyPayload={emptyDocente}
        toPayload={({ numero_empleado, nombres, apellidos, correo, especialidad, cargo, departamento, tipo_contrato, fecha_ingreso, estado }) => ({ numero_empleado, nombres, apellidos, correo, especialidad, cargo, departamento, tipo_contrato, fecha_ingreso, estado })}
        searchableText={(docente) => `${docente.numero_empleado} ${docente.nombres} ${docente.apellidos} ${docente.correo}`}
        columns={[
          { label: 'Empleado', render: (docente) => <strong className="font-semibold text-slate-800 dark:text-slate-100">{docente.numero_empleado}</strong> },
          { label: 'Nombre', render: (docente) => <span className="flex items-center gap-2"><img className="h-8 w-8 rounded-full object-cover" src={docente.foto ?? `/avatars/persona-${String((docente.id - 1) % 12 + 1).padStart(2, '0')}.jpg`} alt="" />{docente.nombres} {docente.apellidos}</span> },
          { label: 'Correo', render: (docente) => <a className="text-sage-600 hover:underline dark:text-sage-400" href={`mailto:${docente.correo}`}>{docente.correo}</a> },
          { label: 'Contrato', render: (docente) => docente.tipo_contrato || 'Sin registrar' },
          { label: 'Secciones actuales', render: (docente) => carga.filter((item) => item.docente_id === docente.id && item.vigente).length },
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
            <button type="button" className="focus-ring inline-flex h-9 items-center gap-1 rounded-lg border px-2 text-xs font-semibold" onClick={() => setDocenteCarga(docente)}><BookOpen className="h-4 w-4" /> Materias y secciones</button>
            <ActionMenu singular="Docente" onEdit={handlers.onEdit} onDelete={handlers.onDelete} extraAction={{ label: 'Ver carnet', icon: <IdCard className="h-4 w-4" />, onSelect: () => handlers.onExtraAction?.() }} />
          </div>
        )}
      />
      {carnet && <PersonCarnetDialog person={carnet} onClose={closeCarnet} />}
      <Modal open={docenteCarga !== null} title={`Carga de ${docenteCarga?.nombres ?? ''} ${docenteCarga?.apellidos ?? ''}`} description={`Contrato: ${docenteCarga?.tipo_contrato || 'sin registrar'}`} onClose={() => setDocenteCarga(null)}>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
          {carga.filter((item) => item.docente_id === docenteCarga?.id).map((item) => <article key={`${item.periodo_id}-${item.seccion}`} className="rounded-xl border p-4 dark:border-white/10">
            <strong>{item.codigo_asignatura} · {item.asignatura}</strong>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Seccion {item.seccion} · Periodo {item.anio}-{item.numero} · {item.estado_seccion}</p>
            <p className="text-xs text-slate-500">{item.dias}, {item.hora_inicio} a {item.hora_fin}</p>
          </article>)}
          {!carga.some((item) => item.docente_id === docenteCarga?.id) && <p className="text-sm text-slate-500">Este docente no tiene secciones asignadas.</p>}
        </div>
      </Modal>
    </>
  )
}
