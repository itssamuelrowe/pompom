import { useCallback, useEffect, useState } from 'react'
import type { OvertimeEntry, TimerMode } from '../types'

const STORAGE_KEY = 'pompom.overtime.v1'
// Cap the stored history so localStorage can't grow without bound.
const MAX_ENTRIES = 100

const VALID_MODES: TimerMode[] = ['pomodoro', 'shortBreak', 'longBreak']

/** Coerce arbitrary parsed JSON into a clean list of overtime entries. */
function sanitize(raw: unknown): OvertimeEntry[] {
  if (!Array.isArray(raw)) return []
  const entries: OvertimeEntry[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    if (typeof r.seconds !== 'number' || !Number.isFinite(r.seconds)) continue
    if (typeof r.endedAt !== 'number' || !Number.isFinite(r.endedAt)) continue
    const mode = VALID_MODES.includes(r.mode as TimerMode)
      ? (r.mode as TimerMode)
      : 'pomodoro'
    const id = typeof r.id === 'string' ? r.id : `${r.endedAt}-${entries.length}`
    entries.push({ id, mode, seconds: Math.max(0, r.seconds), endedAt: r.endedAt })
  }
  return entries.slice(0, MAX_ENTRIES)
}

function load(): OvertimeEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return sanitize(JSON.parse(stored))
  } catch {
    return []
  }
}

/**
 * Persistent log of overtime runs. Newest entries are kept first. The list is
 * mirrored to localStorage so history survives reloads.
 */
export function useOvertimeLog() {
  const [entries, setEntries] = useState<OvertimeEntry[]>(() => load())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // Storage unavailable (private mode / quota) -> keep in memory only.
    }
  }, [entries])

  /** Record a finished overtime run. Sub-second runs are ignored as noise. */
  const add = useCallback((mode: TimerMode, seconds: number) => {
    const rounded = Math.round(seconds)
    if (rounded < 1) return
    const entry: OvertimeEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mode,
      seconds: rounded,
      endedAt: Date.now(),
    }
    setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES))
  }, [])

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clear = useCallback(() => setEntries([]), [])

  return { entries, add, remove, clear }
}
