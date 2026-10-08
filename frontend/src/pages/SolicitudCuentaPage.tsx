import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { solicitarCuenta } from '../services/api'

export function SolicitudCuentaPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSending(true)
    try {
      const result = await solicitarCuenta({
        nombre_completo: String(form.get('nombre_completo')),
        correo: String(form.get('correo')),
        usuario: String(form.get('usuario')),
        contrasena: String(form.get('contrasena')),
      })
      setMessage(result.detail)
      formElement.reset()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo enviar la solicitud.')
    } finally {
      setSending(false)
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[#faf4f1] px-4 py-10 dark:bg-[#261f1d]">
    <section className="w-full max-w-lg rounded-3xl border border-[#ead7d7] bg-white p-7 shadow-xl dark:border-stone-700 dark:bg-[#302624] sm:p-9">
      <Link className="mb-7 inline-flex items-center gap-2 text-sm text-[#6c5552] hover:text-[#5b0309] dark:text-stone-300" to="/login"><ArrowLeft className="h-4 w-4" /> Volver al acceso</Link>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7e4e4] text-[#5b0309] dark:bg-red-950/40 dark:text-rose-200"><UserPlus /></div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a5e5e]">Acceso al campus</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#261b1a] dark:text-white">Solicitar una cuenta</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-stone-300">Un administrador revisara tu solicitud y definira el acceso adecuado. No puedes asignarte un rol desde este formulario.</p>

      {message ? <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100" role="status"><CheckCircle2 className="mb-2 h-5 w-5" />{message}</div> : <form className="mt-7 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium">Nombre completo<input className="mt-1.5 h-11 w-full rounded-xl border bg-transparent px-3" name="nombre_completo" autoComplete="name" minLength={3} maxLength={160} required /></label>
        <label className="block text-sm font-medium">Correo<input className="mt-1.5 h-11 w-full rounded-xl border bg-transparent px-3" name="correo" type="email" autoComplete="email" maxLength={150} required /></label>
        <label className="block text-sm font-medium">Usuario<input className="mt-1.5 h-11 w-full rounded-xl border bg-transparent px-3" name="usuario" autoComplete="username" minLength={3} maxLength={80} required /></label>
        <label className="block text-sm font-medium">Contrasena<input className="mt-1.5 h-11 w-full rounded-xl border bg-transparent px-3" name="contrasena" type="password" autoComplete="new-password" minLength={12} maxLength={72} required /><span className="mt-1 block text-xs font-normal text-slate-500">Usa al menos 12 caracteres.</span></label>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200" role="alert">{error}</p>}
        <button className="h-11 w-full rounded-xl bg-[#5b0309] px-4 text-sm font-semibold text-white transition hover:bg-[#76131a] disabled:opacity-60" disabled={sending}>{sending ? 'Enviando solicitud...' : 'Enviar solicitud'}</button>
      </form>}
    </section>
  </main>
}
