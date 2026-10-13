import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useRef, useState, type PointerEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAuth } from '../contexts/AuthContext'
import { CampusFlowLogo } from '../components/brand/CampusFlowLogo'
import './LoginPage.css'

const loginSchema = z.object({
  usuario: z.string().min(3, 'Ingresa tu usuario.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const cardRef = useRef<HTMLElement>(null)
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

  const handleCardPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5
    event.currentTarget.style.setProperty('--signin-rotate-x', `${vertical * -3}deg`)
    event.currentTarget.style.setProperty('--signin-rotate-y', `${horizontal * 3}deg`)
  }

  const resetCardTilt = () => {
    cardRef.current?.style.setProperty('--signin-rotate-x', '0deg')
    cardRef.current?.style.setProperty('--signin-rotate-y', '0deg')
  }

  return (
    <main className="signin-page">
      <div aria-hidden="true" className="signin-page__grain" />
      <div aria-hidden="true" className="signin-page__glow signin-page__glow--top" />
      <div aria-hidden="true" className="signin-page__glow signin-page__glow--bottom" />

      <section
        ref={cardRef}
        className="signin-card"
        aria-labelledby="signin-title"
        onPointerMove={handleCardPointerMove}
        onPointerLeave={resetCardTilt}
      >
        <div aria-hidden="true" className="signin-card__beam" />
        <div className="signin-card__content">
          <CampusFlowLogo light className="signin-card__logo" />

          <div className="signin-card__intro">
            <p className="signin-card__eyebrow">Tu campus, en un solo lugar</p>
            <h1 id="signin-title">Inicia sesión</h1>
            <p className="signin-card__description">Ingresa tus credenciales para acceder al panel académico.</p>
          </div>

          <form className="signin-form" onSubmit={onSubmit} noValidate>
            <label className="signin-field">
              <span className="signin-field__label">Usuario</span>
              <span className="signin-field__control">
                <Mail aria-hidden="true" className="signin-field__icon" />
                <input
                  aria-invalid={Boolean(errors.usuario)}
                  aria-describedby={errors.usuario ? 'signin-username-error' : undefined}
                  autoComplete="username"
                  placeholder="Tu nombre de usuario"
                  type="text"
                  {...register('usuario')}
                />
              </span>
              {errors.usuario && <span id="signin-username-error" className="signin-field__error">{errors.usuario.message}</span>}
            </label>

            <label className="signin-field">
              <span className="signin-field__label">Contraseña</span>
              <span className="signin-field__control">
                <LockKeyhole aria-hidden="true" className="signin-field__icon" />
                <input
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'signin-password-error' : undefined}
                  autoComplete="current-password"
                  placeholder="Escribe tu contraseña"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                />
                <button
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="signin-field__toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </span>
              {errors.password && <span id="signin-password-error" className="signin-field__error">{errors.password.message}</span>}
            </label>

            {serverError && <p className="signin-form__server-error" role="alert">{serverError}</p>}

            <button className="signin-submit" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Ingresando…' : 'Ingresar al campus'}</span>
              {!isSubmitting && <ArrowRight aria-hidden="true" />}
              {isSubmitting && <span aria-hidden="true" className="signin-submit__spinner" />}
            </button>
          </form>

          <div className="signin-links">
            <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
            <span aria-hidden="true" className="signin-links__separator" />
            <Link to="/solicitar-cuenta">Solicitar una cuenta</Link>
          </div>
        </div>
      </section>

      <p className="signin-page__footer">© {new Date().getFullYear()} CampusFlow · Universidad Politécnica de Honduras</p>
    </main>
  )
}
