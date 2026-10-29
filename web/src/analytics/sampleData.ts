import type { SessionRecord, TimerMode } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * A small seeded PRNG (mulberry32) so the sample data is deterministic: the
 * preview looks the same every time instead of flickering between renders.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a believable set of session records spanning the last `days` days,
 * used to preview the analytics screen before the user has logged real data.
 * Not persisted: it only ever lives in memory for the preview.
 */
export function generateSampleRecords(days = 30): SessionRecord[] {
  const rand = mulberry32(20240607)
  const records: SessionRecord[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  for (let d = days - 1; d >= 0; d--) {
    const dayStart = todayMs - d * DAY_MS

    // Skip roughly one in six days to create realistic gaps and streaks.
    if (rand() < 0.16) continue

    // 2 to 7 pomodoros a day, more on weekdays.
    const weekday = new Date(dayStart).getDay()
    const isWeekend = weekday === 0 || weekday === 6
    const base = isWeekend ? 2 : 4
    const pomodoros = base + Math.floor(rand() * 4)

    // Start the day somewhere between 8am and 10am.
    let cursor = dayStart + (8 + Math.floor(rand() * 2)) * 60 * 60 * 1000

    for (let p = 0; p < pomodoros; p++) {
      const planned = 25 * 60
      // Most pomodoros finish clean; some run over (the whole point of PomPom).
      const overtime = rand() < 0.35 ? Math.floor(rand() * 12 * 60) : 0
      cursor += planned * 1000 + overtime * 1000
      records.push(
        makeRecord('pomodoro', planned, planned, overtime, true, cursor),
      )

      // A break follows each pomodoro (long break every 4th).
      const isLong = (p + 1) % 4 === 0
      const mode: TimerMode = isLong ? 'longBreak' : 'shortBreak'
      const breakPlanned = (isLong ? 15 : 5) * 60
      // Breaks sometimes get cut short, sometimes run over.
      const cut = rand() < 0.3
      const active = cut
        ? Math.floor(breakPlanned * (0.3 + rand() * 0.5))
        : breakPlanned
      const breakOver = !cut && rand() < 0.25 ? Math.floor(rand() * 5 * 60) : 0
      cursor += active * 1000 + breakOver * 1000
      records.push(
        makeRecord(mode, breakPlanned, active, breakOver, !cut, cursor),
      )
    }
  }

  // Newest first, matching the real tracker's ordering.
  return records.sort((a, b) => b.endedAt - a.endedAt)
}

function makeRecord(
  mode: TimerMode,
  plannedSeconds: number,
  activeSeconds: number,
  overtimeSeconds: number,
  completed: boolean,
  endedAt: number,
): SessionRecord {
  return {
    id: `sample-${mode}-${endedAt}-${Math.round(activeSeconds)}`,
    mode,
    plannedSeconds,
    activeSeconds,
    overtimeSeconds,
    completed,
    endedAt,
  }
}
