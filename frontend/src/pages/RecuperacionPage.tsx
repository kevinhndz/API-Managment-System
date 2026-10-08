import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { restablecerContrasena, solicitarRecuperacion } from '../services/api'
import { PasswordInput } from '../components/ui/PasswordInput'

export function RecuperacionPage() {
  const [search] = useSearchParams()
  const token = search.get('token')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSending(true)
    try {
      if (token) {
        const contrasena = String(form.get('contrasena'))
        if (contrasena !== form.get('confirmacion')) throw new Error('Las contrasenas no coinciden.')
        const result = await restablecerContrasena(token, contrasena)
        setMessage(result.detail)
      } else {
        const result = await solicitarRecuperacion(String(form.get('correo')))
        setMessage(result.detail)
      }
      formElement.reset()
      setContrasena('')
      setConfirmacion('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la solicitud.')
    } finally {
      setSending(false)
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[#faf4f1] px-4 py-10 dark:bg-[#261f1d]">
    <section className="w-full max-w-lg rounded-3xl border border-[#ead7d7] bg-white p-7 shadow-xl dark:border-stone-700 dark:bg-[#302624] sm:p-9">
      <Link className="mb-7 inline-flex items-center gap-2 text-sm text-[#6c5552] hover:text-[#5b0309] dark:text-stone-300" to="/login"><ArrowLeft className="h-4 w-4" /> Volver al acceso</Link>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7e4e4] text-[#5b0309] dark:bg-red-950/40 dark:text-rose-200">{token ? <KeyRound /> : <MailCheck />}</div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a5e5e]">Seguridad de cuenta</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#261b1a] dark:text-white">{token ? 'Elige una nueva contrasena' : 'Recuperar contrasena'}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-stone-300">{token ? 'El enlace es de un solo uso y vence en 30 minutos.' : 'Escribe el correo asociado a tu cuenta. Si existe, enviaremos un enlace para cambiar la contrasena.'}</p>
      {message ? <div className="mt-7 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100" role="status">{message}{token && <p className="mt-3"><Link className="font-semibold underline" to="/login">Ir al acceso</Link></p>}</div> : <form className="mt-7 space-y-4" onSubmit={submit}>
        {token ? <>
          <PasswordInput id="recuperacion-contrasena" label="Nueva contraseña" name="contrasena" value={contrasena} onChange={setContrasena} minLength={12} maxLength={72} />
          <PasswordInput id="recuperacion-confirmacion" label="Confirmar contraseña" name="confirmacion" value={confirmacion} onChange={setConfirmacion} minLength={12} maxLength={72} showStrength={false} />
        </> : <label className="block text-sm font-medium">Correo<input className="mt-1.5 h-11 w-full rounded-xl border bg-transparent px-3" name="correo" type="email" autoComplete="email" required /></label>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200" role="alert">{error}</p>}
        <button className="h-11 w-full rounded-xl bg-[#5b0309] px-4 text-sm font-semibold text-white transition hover:bg-[#76131a] disabled:opacity-60" disabled={sending}>{sending ? 'Procesando...' : token ? 'Cambiar contrasena' : 'Enviar enlace'}</button>
      </form>}
    </section>
  </main>
}
