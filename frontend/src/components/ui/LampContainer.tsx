import { motion, useReducedMotion } from 'framer-motion'

interface LampContainerProps {
  className?: string
}

/** Lámpara decorativa del encabezado; su haz se abre al cargar la página. */
export function LampContainer({ className = '' }: LampContainerProps) {
  const reduceMotion = useReducedMotion()
  const transition = reduceMotion ? { duration: 0 } : { duration: 1.35, delay: 0.15, ease: 'easeOut' as const }

  return (
    <div aria-hidden="true" className={`pointer-events-none relative w-full overflow-visible ${className}`}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="absolute left-1/2 top-0 z-20 flex -translate-x-1/2 flex-col items-center"
      >
        <span className="h-12 w-px bg-gradient-to-b from-transparent via-violet-200/70 to-violet-100" />
        <span className="relative -mt-px h-4 w-24 rounded-t-[100%] border-t-2 border-violet-100/90 bg-gradient-to-b from-violet-100/30 to-transparent shadow-[0_-4px_20px_rgb(216_180_254_/_0.6)] sm:w-32" />
        <span className="h-1 w-14 rounded-full bg-violet-100 shadow-[0_0_22px_8px_rgb(192_132_252_/_0.65)] sm:w-20" />
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scaleY: 0.08 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={transition}
        className="absolute left-1/2 top-[4.1rem] z-0 h-[min(100svh,820px)] w-[min(118vw,1500px)] -translate-x-1/2 origin-top"
        style={{
          clipPath: 'polygon(48.5% 0, 51.5% 0, 100% 100%, 0 100%)',
          background: 'linear-gradient(180deg, rgb(192 132 252 / .2) 0%, rgb(139 92 246 / .09) 34%, rgb(139 92 246 / .025) 72%, transparent 100%)',
          filter: 'blur(18px)',
        }}
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scaleX: 0.25 }}
        animate={{ opacity: [0.35, 0.82, 0.62], scaleX: 1 }}
        transition={reduceMotion ? { duration: 0 } : { ...transition, opacity: { duration: 2.2, repeat: 1, ease: 'easeInOut' } }}
        className="absolute left-1/2 top-[4.7rem] z-10 h-24 w-[min(75vw,800px)] -translate-x-1/2 rounded-full bg-violet-300/25 blur-[70px]"
      />
    </div>
  )
}
