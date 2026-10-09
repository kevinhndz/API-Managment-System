import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'

import { LampContainer } from '../ui/LampContainer'

export function LoginLanding() {
  const [showNavigation, setShowNavigation] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) setShowNavigation(true)
  }, [reduceMotion])

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#100d18] text-white">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_0%,rgb(139_92_246_/_0.2),transparent_78%)]" />

      <nav
        aria-label="Navegación principal"
        aria-hidden={!showNavigation}
        className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#100d18]/80 px-5 py-3 backdrop-blur-xl transition duration-500 sm:px-8 ${showNavigation ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#inicio" className="font-semibold tracking-tight text-white" tabIndex={showNavigation ? 0 : -1}>
            Campus<span className="text-violet-300">Flow</span>
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link className="rounded-full px-3 py-2 text-sm text-violet-100 transition hover:bg-white/10" to="/iniciar-sesion" tabIndex={showNavigation ? 0 : -1}>
              Iniciar sesión
            </Link>
            <Link className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400" to="/solicitar-cuenta" tabIndex={showNavigation ? 0 : -1}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      <section id="inicio" className="relative z-10 min-h-svh overflow-hidden px-4 sm:px-8">
        <LampContainer
          className="absolute inset-x-0 top-0 z-0 isolate h-[min(100svh,820px)]"
          onOpen={() => setShowNavigation(true)}
        />
        <div className="relative z-10 mx-auto flex min-h-svh max-w-6xl flex-col items-center justify-start pt-[clamp(9rem,21svh,11rem)] text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-violet-100/90 sm:text-sm">Gestión académica, más clara</p>
          <h1 className="text-6xl font-semibold tracking-[-0.075em] text-white drop-shadow-[0_4px_28px_rgb(16_13_24_/_0.95)] sm:text-8xl lg:text-[7.5rem]">
            Campus Flow
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-violet-50/90 sm:text-base">
            Todo tu campus conectado en un solo lugar.
          </p>
          <Link className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#171124]/65 px-5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition hover:border-violet-200/50 hover:bg-[#241637]/85" to="/iniciar-sesion">
            Entrar al campus <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
