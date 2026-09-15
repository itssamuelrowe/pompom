import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  DURATION_LIMITS,
  type Settings,
  type ThemeMode,
  type RingtoneId,
} from '../types'
import { ACCENT_COLORS } from '../theme/palette'
import { RINGTONES } from '../audio/ringtones'

const STORAGE_KEY = 'pompom.settings.v1'

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  const rounded = Math.round(n)
  return Math.min(max, Math.max(min, rounded))
}

/**
 * Coerce arbitrary parsed JSON into a valid Settings object, falling back to
 * defaults for any missing or corrupted field.
 */
function sanitize(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const r = raw as Record<string, unknown>

  const validRingtone = RINGTONES.some((x) => x.id === r.ringtone)
    ? (r.ringtone as RingtoneId)
    : DEFAULT_SETTINGS.ringtone

  const validAccent = ACCENT_COLORS.some((x) => x.id === r.accentColor)
    ? (r.accentColor as string)
    : DEFAULT_SETTINGS.accentColor

  const themeMode: ThemeMode = ['light', 'dark', 'system'].includes(
    r.themeMode as string,
  )
    ? (r.themeMode as ThemeMode)
    : DEFAULT_SETTINGS.themeMode

  return {
    pomodoroDuration: clampInt(
      r.pomodoroDuration,
      DURATION_LIMITS.min,
      DURATION_LIMITS.max,
      DEFAULT_SETTINGS.pomodoroDuration,
    ),
    shortBreakDuration: clampInt(
      r.shortBreakDuration,
      DURATION_LIMITS.min,
      DURATION_LIMITS.max,
      DEFAULT_SETTINGS.shortBreakDuration,
    ),
    longBreakDuration: clampInt(
      r.longBreakDuration,
      DURATION_LIMITS.min,
      DURATION_LIMITS.max,
      DEFAULT_SETTINGS.longBreakDuration,
    ),
    pomodorosBeforeLongBreak: clampInt(
      r.pomodorosBeforeLongBreak,
      DURATION_LIMITS.poolMin,
      DURATION_LIMITS.poolMax,
      DEFAULT_SETTINGS.pomodorosBeforeLongBreak,
    ),
    ringtone: validRingtone,
    keepRinging:
      typeof r.keepRinging === 'boolean'
        ? r.keepRinging
        : DEFAULT_SETTINGS.keepRinging,
    autoCycle:
      typeof r.autoCycle === 'boolean'
        ? r.autoCycle
        : DEFAULT_SETTINGS.autoCycle,
    themeMode,
    accentColor: validAccent,
    volume:
      typeof r.volume === 'number' && r.volume >= 0 && r.volume <= 1
        ? r.volume
        : DEFAULT_SETTINGS.volume,
  }
}

function load(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...DEFAULT_SETTINGS }
    return sanitize(JSON.parse(stored))
  } catch {
    // Corrupted JSON or storage unavailable -> safe defaults.
    return { ...DEFAULT_SETTINGS }
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => load())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // localStorage may be unavailable (private mode / quota). Ignore so the
      // app keeps working in-memory for the session.
    }
  }, [settings])

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS })
  }, [])

  return { settings, update, reset }
}
