import { useEffect, useRef, useState } from 'react'

/** Ease-out cubic for a natural "settle" on entrance. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Drives a one-shot entrance animation. Returns an eased progress value from 0
 * to 1 over `duration` ms, starting on mount. Charts multiply their geometry
 * by this so bars grow, arcs sweep and lines draw in.
 *
 * Respects `prefers-reduced-motion`: if the user asks for reduced motion the
 * value jumps straight to 1 (no animation).
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

export function useChartReveal(duration = 650): number {
  // Start fully revealed when reduced motion is requested, so the effect never
  // needs to flip state synchronously.
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0))
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    let start: number | null = null
    const tick = (now: number) => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / duration)
      setProgress(easeOutCubic(t))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [duration])

  return progress
}
