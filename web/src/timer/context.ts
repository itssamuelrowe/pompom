import { createContext, useContext } from 'react'
import type { TimerEngine } from '../hooks/useTimerEngine'

/**
 * The timer engine plus the shared panel open-state. Lives above the router so
 * the running session and its dialogs survive navigation between the timer and
 * analytics pages (that's what lets the mini timer keep working).
 */
export interface TimerContextValue extends TimerEngine {
  settingsOpen: boolean
  setSettingsOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  historyOpen: boolean
  setHistoryOpen: (open: boolean) => void
}

export const TimerContext = createContext<TimerContextValue | null>(null)

/** Access the shared timer engine. Throws if used outside the provider. */
export function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) {
    throw new Error('useTimerContext must be used within a TimerProvider')
  }
  return ctx
}
