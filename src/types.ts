export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak'

export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'RINGING'

export type ThemeMode = 'light' | 'dark' | 'system'

export type RingtoneId =
  | 'gentle-bell'
  | 'digital-chime'
  | 'soft-marimba'
  | 'classic-alarm'
  | 'zen-gong'

export interface Settings {
  pomodoroDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  pomodorosBeforeLongBreak: number
  ringtone: RingtoneId
  keepRinging: boolean
  autoCycle: boolean
  themeMode: ThemeMode
  accentColor: string
  volume: number
}

export const DEFAULT_SETTINGS: Settings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosBeforeLongBreak: 4,
  ringtone: 'gentle-bell',
  keepRinging: true,
  autoCycle: true,
  themeMode: 'light',
  accentColor: 'tomato',
  volume: 0.7,
}

export const DURATION_LIMITS = {
  min: 1,
  max: 180,
  poolMin: 1,
  poolMax: 12,
} as const

export const MODE_LABELS: Record<TimerMode, string> = {
  pomodoro: 'Pomodoro',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}
