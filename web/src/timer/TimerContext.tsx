import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  useTimerEngine,
  type TimerEngineSettings,
} from '../hooks/useTimerEngine'
import { TimerContext, type TimerContextValue } from './context'

/**
 * Hosts the timer engine and the shared panel open-state, provided to the
 * whole routed tree. Placed above the router so the session persists across
 * navigation.
 */
export function TimerProvider({
  settingsApi,
  children,
}: {
  settingsApi: TimerEngineSettings
  children: ReactNode
}) {
  const engine = useTimerEngine(settingsApi)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const value = useMemo<TimerContextValue>(
    () => ({ ...engine, settingsOpen, setSettingsOpen, historyOpen, setHistoryOpen }),
    [engine, settingsOpen, historyOpen],
  )

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}
