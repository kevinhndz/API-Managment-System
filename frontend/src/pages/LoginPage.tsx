import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAuth } from '../contexts/AuthContext'
import { CampusFlowLogo } from '../components/brand/CampusFlowLogo'

const loginSchema = z.object({
  usuario: z.string().min(3, 'Ingresa tu usuario.'),
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
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  if (isAuthenticated) return <Navigate to="/" replace />

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')
    try {
      await login(values.usuario, values.password)
      const destination = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No fue posible iniciar sesión.')
    }
  })

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#100d18] px-4 py-5 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:24px_24px]" />
      <section className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[1.5rem] border border-[#34264a] bg-[#191523] shadow-[0_30px_100px_-35px_rgb(0_0_0_/_0.8)] lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden overflow-hidden bg-[#241637] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgb(192_132_252_/_0.2),transparent_22rem),linear-gradient(145deg,#4c1d75,#171221_78%)]" />
          <CampusFlowLogo light className="relative" />

          <div className="relative max-w-md">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">Gestión académica</p>
            <h1 className="max-w-md text-5xl font-semibold leading-[1.02] tracking-[-0.06em]">Tu campus, organizado en un solo lugar.</h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-violet-100/75">
              Administra aulas, docentes y carreras con información clara y decisiones respaldadas por datos.
            </p>
          </div>

          <p className="relative text-xs text-violet-100/55">© {new Date().getFullYear()} CampusFlow · Universidad Politécnica de Honduras</p>
        </div>

        <div className="flex items-center justify-center bg-[#171421] px-6 py-12 text-white sm:px-12 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <CampusFlowLogo light className="mb-10 lg:hidden" />

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">Bienvenido de nuevo</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-white">Inicia sesión</h2>
            <p className="mt-3 text-sm leading-6 text-[#b9a9bd]">Ingresa tus credenciales para acceder al panel académico.</p>

            <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
              <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#d8c9df]">Usuario</span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7e6d6d]" />
                  <input
                    className="focus-ring h-12 w-full rounded-xl border border-[#443650] bg-[#211b2b] pl-11 pr-4 text-sm text-white placeholder:text-[#93899c]"
                    type="text"
                    autoComplete="username"
                    placeholder="admin"
                    {...register('usuario')}
                  />
                </span>
                {errors.usuario && <span className="mt-1.5 block text-xs text-rose-300">{errors.usuario.message}</span>}
              </label>

              <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#d8c9df]">Contraseña</span>
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7e6d6d]" />
                  <input
                    className="focus-ring h-12 w-full rounded-xl border border-[#443650] bg-[#211b2b] pl-11 pr-12 text-sm text-white placeholder:text-[#93899c]"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    className="focus-ring absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#a59aae] hover:text-white"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
                {errors.password && <span className="mt-1.5 block text-xs text-rose-300">{errors.password.message}</span>}
              </label>

              {serverError && <p className="rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{serverError}</p>}

              <button
                className="focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7e22ce] px-5 text-sm font-semibold text-white transition hover:bg-[#9333ea] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Ingresando…' : 'Ingresar'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
              <Link className="text-violet-300 hover:text-violet-200 hover:underline" to="/recuperar-contrasena">Olvide mi contrasena</Link>
              <Link className="font-semibold text-violet-300 hover:text-violet-200 hover:underline" to="/solicitar-cuenta">Solicitar una cuenta</Link>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
