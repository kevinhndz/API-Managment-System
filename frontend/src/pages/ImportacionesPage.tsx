import { useState, type FormEvent } from 'react'
import { confirmarImportacion, previsualizarImportacion } from '../services/api'

export function ImportacionesPage() {
  const [tipo, setTipo] = useState('carreras')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [vista, setVista] = useState<{ token: string; total: number; validos: number; invalidos: number; errores: { fila: number; error: string }[] } | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [ocupado, setOcupado] = useState(false)
  async function revisar(evento: FormEvent) {
    evento.preventDefault(); if (!archivo) return
    setOcupado(true); setMensaje(''); setVista(null)
    try { setVista(await previsualizarImportacion(tipo, archivo)) }
    catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo revisar el archivo.') }
    finally { setOcupado(false) }
  }
  async function confirmar() {
    if (!vista) return
    setOcupado(true)
    try { const resultado = await confirmarImportacion(vista.token); setMensaje(`${resultado.importados} registros importados; ${resultado.omitidos} omitidos.`); setVista(null) }
    catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo importar.') }
    finally { setOcupado(false) }
  }
  return <div className="mx-auto max-w-4xl space-y-7"><header><p className="text-sm font-semibold text-sage-600">Administracion</p><h1 className="mt-1 text-3xl font-semibold dark:text-white">Importar datos</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Las filas se validan y se asocian exclusivamente con tu universidad.</p></header>
    <form onSubmit={(event) => void revisar(event)} className="grid gap-4 rounded-2xl border bg-white p-6 dark:border-white/10 dark:bg-[#242033]"><label className="font-medium dark:text-white">Tipo de datos<select value={tipo} onChange={(event) => { setTipo(event.target.value); setVista(null) }} className="mt-2 block w-full rounded-lg border p-3 text-slate-900"><option value="carreras">Carreras</option><option value="docentes">Docentes</option><option value="estudiantes">Estudiantes</option></select></label><p className="text-sm text-slate-600 dark:text-slate-300">Columnas requeridas: {tipo === 'carreras' ? 'codigo, nombre, duracion_anios' : tipo === 'docentes' ? 'numero_empleado, nombres, apellidos, correo, especialidad' : 'cuenta, nombre, correo, carrera_codigo'}. Usa CSV UTF-8 o XLSX, hasta 2 MB y 5000 filas. Importa carreras antes que estudiantes.</p><input aria-label="Archivo para importar" type="file" accept=".csv,.xlsx" onChange={(event) => { setArchivo(event.target.files?.[0] ?? null); setVista(null) }} required /><button disabled={ocupado || !archivo} className="w-fit rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white disabled:opacity-50">Validar archivo</button></form>
    {mensaje && <p role="status" className="rounded-xl bg-slate-100 p-4 dark:bg-white/10 dark:text-white">{mensaje}</p>}
    {vista && <section className="rounded-2xl border bg-white p-6 dark:border-white/10 dark:bg-[#242033] dark:text-white"><h2 className="text-xl font-semibold">Vista previa</h2><p className="mt-2">{vista.total} filas: {vista.validos} validas y {vista.invalidos} invalidas.</p>{vista.errores.length > 0 && <ul className="mt-4 max-h-64 space-y-1 overflow-auto text-sm text-red-700 dark:text-red-300">{vista.errores.map((item) => <li key={item.fila}>Fila {item.fila}: {item.error}</li>)}</ul>}<button type="button" disabled={ocupado || !vista.validos} onClick={() => void confirmar()} className="mt-5 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white disabled:opacity-50">Importar {vista.validos} registros validos</button></section>}
    <p className="text-sm text-slate-500">Para migraciones grandes o formatos distintos, solicita una migracion asistida al equipo de CampusFlow. Se revisan mapeos y errores antes de cargar datos a tu institucion.</p>
  </div>
}
