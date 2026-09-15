import type { Settings } from './types'

/**
 * A template is a named preset for the core focus/break rhythm. Picking one on
 * first visit seeds the user's settings with a sensible work / short break /
 * long break format; everything stays editable afterwards in Settings.
 */
export interface Template {
  id: string
  name: string
  description: string
  pomodoroDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  pomodorosBeforeLongBreak: number
}

export const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classic Pomodoro',
    description: 'The original rhythm. Great all-rounder for most work.',
    pomodoroDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosBeforeLongBreak: 4,
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    description: 'Longer focus blocks for demanding, flow-heavy tasks.',
    pomodoroDuration: 50,
    shortBreakDuration: 10,
    longBreakDuration: 30,
    pomodorosBeforeLongBreak: 3,
  },
  {
    id: 'eye-back-relief',
    name: 'Eye and Back Relief',
    description:
      'Frequent, generous breaks to rest tired eyes and ease back strain.',
    pomodoroDuration: 10,
    shortBreakDuration: 10,
    longBreakDuration: 20,
    pomodorosBeforeLongBreak: 4,
  },
]

export const DEFAULT_TEMPLATE_ID = 'classic'

/**
 * Sentinel id stored when the user chooses to start from a blank, custom
 * format rather than a preset. It is a valid "chosen" value so the setup
 * screen is not shown again.
 */
export const CUSTOM_TEMPLATE_ID = 'custom'

/** Ids that count as a completed first-run choice. */
export function isChosenTemplateId(id: string | null | undefined): boolean {
  if (!id) return false
  return id === CUSTOM_TEMPLATE_ID || TEMPLATES.some((t) => t.id === id)
}

export function getTemplate(id: string | null | undefined): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

/** The settings fields a template controls. */
export function templateToSettings(
  t: Template,
): Pick<
  Settings,
  | 'pomodoroDuration'
  | 'shortBreakDuration'
  | 'longBreakDuration'
  | 'pomodorosBeforeLongBreak'
> {
  return {
    pomodoroDuration: t.pomodoroDuration,
    shortBreakDuration: t.shortBreakDuration,
    longBreakDuration: t.longBreakDuration,
    pomodorosBeforeLongBreak: t.pomodorosBeforeLongBreak,
  }
}

/**
 * Find the template whose durations exactly match the current settings, if any.
 * Used to label the active format once the user is inside the app.
 */
export function matchTemplate(settings: Settings): Template | undefined {
  return TEMPLATES.find(
    (t) =>
      t.pomodoroDuration === settings.pomodoroDuration &&
      t.shortBreakDuration === settings.shortBreakDuration &&
      t.longBreakDuration === settings.longBreakDuration &&
      t.pomodorosBeforeLongBreak === settings.pomodorosBeforeLongBreak,
  )
}
