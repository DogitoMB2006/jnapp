import { useReducedMotion } from "framer-motion"
import type { Transition, Variants } from "framer-motion"

export const springSnappy = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.65,
}

export const crossfadeTransition: Transition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
}

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
}

export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const tapScale = { whileTap: { scale: 0.92 } }

export function usePrefersReducedMotion(): boolean {
  return Boolean(useReducedMotion())
}

type MotionProps = Record<string, unknown>

/** Strip infinite/repeat motion when user prefers reduced motion. */
export function staticIfReduced<T extends MotionProps>(
  reduced: boolean,
  props: T,
  fallback: MotionProps = {},
): T | MotionProps {
  if (!reduced) return props
  return fallback
}

export function staggerDelay(index: number, step = 0.04, max = 0.24): number {
  return Math.min(index * step, max)
}
