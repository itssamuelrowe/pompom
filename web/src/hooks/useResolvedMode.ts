import { useEffect, useState } from 'react'
import type { ThemeMode } from '../types'

/** Resolves a ThemeMode preference into a concrete 'light' | 'dark' value. */
export function useResolvedMode(themeMode: ThemeMode): 'light' | 'dark' {
  const getSystem = (): 'light' | 'dark' =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(getSystem)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const handler = (e: MediaQueryListEvent) =>
      setSystemMode(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (themeMode === 'system') return systemMode
  return themeMode
}
