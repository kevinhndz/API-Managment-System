import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, BookOpen, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { DEMO_CREDENTIALS, useAuth } from '../contexts/AuthContext'

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  if (isAuthenticated) return <Navigate to="/" replace />

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')
    try {
      await login(values.email, values.password)
      const destination = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No fue posible iniciar sesión.')
    }
  })

  const useDemoAccount = () => {
    setValue('email', DEMO_CREDENTIALS.email, { shouldValidate: true })
    setValue('password', DEMO_CREDENTIALS.password, { shouldValidate: true })
    setServerError('')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f0e8] px-4 py-8 dark:bg-stone-950 sm:px-8">
      <div className="pointer-events-none absolute -left-28 top-[-9rem] h-96 w-96 rounded-full bg-sage-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-navy-600/15 blur-3xl" />

      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-[#e9dfcf] bg-[#fffdf8] shadow-[0_28px_90px_-35px_rgba(91,70,44,0.28)] dark:border-stone-800 dark:bg-stone-900 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-navy-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(135deg,transparent_0%,transparent_47%,rgba(255,255,255,.13)_48%,transparent_49%),linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:180px_180px,42px_42px,42px_42px]" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">CampusFlow</span>
          </div>

          <div className="relative max-w-md">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-sage-100">Gestión académica</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em]">Tu campus, organizado en un solo lugar.</h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              Administra aulas, docentes y carreras con información clara y decisiones respaldadas por datos.
            </p>
          </div>

          <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} CampusFlow</p>
        </div>

        <div className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-20">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-white">
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="font-semibold text-navy-900 dark:text-white">CampusFlow</span>
            </div>

            <p className="text-sm font-semibold text-sage-600 dark:text-sage-400">Bienvenido de nuevo</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-950 dark:text-white">Inicia sesión</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Ingresa tus credenciales para acceder al panel académico.</p>

            <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Correo electrónico</span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="focus-ring h-12 w-full rounded-xl border bg-[#faf7f0] pl-11 pr-4 text-sm placeholder:text-slate-400 dark:bg-stone-950"
                    type="email"
                    autoComplete="email"
                    placeholder="nombre@campus.edu"
                    {...register('email')}
                  />
                </span>
                {errors.email && <span className="mt-1.5 block text-xs text-red-600">{errors.email.message}</span>}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Contraseña</span>
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="focus-ring h-12 w-full rounded-xl border bg-[#faf7f0] pl-11 pr-12 text-sm placeholder:text-slate-400 dark:bg-stone-950"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    className="focus-ring absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
                {errors.password && <span className="mt-1.5 block text-xs text-red-600">{errors.password.message}</span>}
              </label>

              {serverError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{serverError}</p>}

              <button
                className="focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sage-500 dark:hover:bg-sage-600"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Ingresando…' : 'Ingresar'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-7 rounded-2xl border bg-[#faf7f0] p-4 text-sm dark:bg-stone-950">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Acceso de demostración</p>
                  <p className="mt-1 text-xs text-slate-500">Credenciales disponibles para revisión local.</p>
                </div>
                <button className="focus-ring shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-sage-600 hover:bg-sage-50 dark:text-sage-400 dark:hover:bg-sage-950" type="button" onClick={useDemoAccount}>
                  Completar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
