import type { Settings } from './types'

/**
 * Default values and validation limits for user settings.
 *
 * Kept separate from the type definitions in `types.ts` so the baseline
 * configuration lives in one obvious place. `useSettings` falls back to these
 * for any missing or corrupted field, and "Reset to defaults" restores them.
 */
export const DEFAULT_SETTINGS: Settings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosBeforeLongBreak: 4,
  ringtone: 'gentle-bell',
  keepRinging: true,
  autoCycle: true,
  autoStartNext: false,
  idleReminderEnabled: true,
  idleReminderInterval: 5,
  idleReminderMessage: "Ready to focus? Your timer is waiting.",
  idleReminderFunny: true,
  remindOnSessionEnd: true,
  idleSoundEnabled: true,
  themeMode: 'system',
  accentColor: 'tomato',
  volume: 0.7,
  templateId: null,
}

/** Allowed range (minutes) for durations, and count for the long-break pool. */
export const DURATION_LIMITS = {
  min: 1,
  max: 180,
  poolMin: 1,
  poolMax: 12,
} as const

/** Allowed range (minutes) for the idle reminder / sound cadence. */
export const REMINDER_INTERVAL_LIMITS = {
  min: 1,
  max: 120,
} as const

/** Maximum length of a custom idle reminder message. */
export const IDLE_REMINDER_MESSAGE_MAX = 120
