export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak'

export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'RINGING'

export type ThemeMode = 'light' | 'dark' | 'system'

export type RingtoneId =
  | 'gentle-bell'
  | 'digital-chime'
  | 'soft-marimba'
  | 'classic-alarm'
  | 'zen-gong'
  | 'crystal-ping'
  | 'warm-pluck'
  | 'bubble-pop'
  | 'rising-arp'
  | 'wood-block'
  | 'cosmic-shimmer'
  | 'random'

export interface Settings {
  pomodoroDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  pomodorosBeforeLongBreak: number
  ringtone: RingtoneId
  keepRinging: boolean
  autoCycle: boolean
  /** Automatically start the next session when one completes (no clicks). */
  autoStartNext: boolean
  /** Remind the user with a browser notification while the timer is idle. */
  idleReminderEnabled: boolean
  /** Minutes between idle reminder notifications. */
  idleReminderInterval: number
  /** Body text of the idle reminder notification (used when not funny). */
  idleReminderMessage: string
  /** Use a random funny message for each reminder instead of the fixed text. */
  idleReminderFunny: boolean
  /** Also send a reminder when a pomodoro or break ends. */
  remindOnSessionEnd: boolean
  /**
   * Play a short two-beat sound periodically while the timer is idle. Shares
   * `idleReminderInterval` for its cadence.
   */
  idleSoundEnabled: boolean
  themeMode: ThemeMode
  accentColor: string
  volume: number
  /** Id of the template the user picked on first visit (null until chosen). */
  templateId: string | null
}

/** A single recorded overtime run: how long the user worked past a session. */
export interface OvertimeEntry {
  /** Unique id (timestamp-based). */
  id: string
  /** The mode that had just finished when the overtime started. */
  mode: TimerMode
  /** Overtime duration in seconds. */
  seconds: number
  /** When the overtime run ended (epoch ms). */
  endedAt: number
}

export const MODE_LABELS: Record<TimerMode, string> = {
  pomodoro: 'Pomodoro',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}

/**
 * A single completed session, persisted so analytics can reconstruct the
 * user's real working pattern (not just the planned one).
 *
 * Every time a timer session finishes we store how long it was *planned* to
 * run, how much of that the user actually spent in the main phase, and how
 * much *overtime* they ran past the bell before moving on. Splitting the two
 * lets analytics separate "working" from "overworking" and "breaking" from
 * "overbreaking".
 */
export interface SessionRecord {
  /** Unique id (timestamp + random suffix). */
  id: string
  /** Which kind of session this was. */
  mode: TimerMode
  /** Planned duration in seconds (the configured length when it started). */
  plannedSeconds: number
  /**
   * Seconds actually spent in the main (pre-bell) phase. Normally equal to
   * plannedSeconds for a session that ran to completion, or less if it was
   * skipped/reset early.
   */
  activeSeconds: number
  /** Seconds the user ran past the bell before starting the next session. */
  overtimeSeconds: number
  /** Whether the timer rang (reached zero) rather than being skipped early. */
  completed: boolean
  /** When the session was recorded (epoch ms). */
  endedAt: number
}

/** True for pomodoro mode, which counts as "work" in analytics. */
export function isWorkMode(mode: TimerMode): boolean {
  return mode === 'pomodoro'
}

/** The four buckets analytics tracks time against. */
export type TimeCategory = 'working' | 'overworking' | 'breaking' | 'overbreaking'

export const CATEGORY_LABELS: Record<TimeCategory, string> = {
  working: 'Working',
  overworking: 'Overworking',
  breaking: 'Breaking',
  overbreaking: 'Overbreaking',
}
