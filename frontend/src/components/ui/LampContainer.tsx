import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface LampContainerProps {
  children: ReactNode
  className?: string
}

/** Luz que se abre al montar la vista, basada en la referencia de front.md. */
export function LampContainer({ children, className = '' }: LampContainerProps) {
  const reduceMotion = useReducedMotion()
  const transition = reduceMotion ? { duration: 0 } : { duration: 1, delay: 0.12, ease: 'easeInOut' as const }

  return (
    <div className={`relative isolate flex min-h-[min(760px,100svh)] w-full flex-col items-center justify-center overflow-hidden bg-[#100d18] ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_72%,rgb(126_34_206_/_0.15),transparent_34rem)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[52%] h-40 -translate-y-1/2 bg-[#100d18] blur-3xl" />

      <motion.div
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scaleX: 0.45 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={transition}
        className="pointer-events-none absolute left-1/2 top-[48%] z-10 h-px w-[min(72vw,760px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-200 to-transparent shadow-[0_0_18px_3px_rgb(192_132_252_/_0.75)]"
      />

      <motion.div
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scaleX: 0.45 }}
        animate={{ opacity: 0.72, scaleX: 1 }}
        transition={transition}
        className="pointer-events-none absolute left-1/2 top-[48%] z-0 h-64 w-[min(85vw,840px)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-violet-500/30 blur-[90px]"
      />

      <div className="relative z-20 flex w-full flex-col items-center px-5 text-center">
        {children}
      </div>
    </div>
  )
}
