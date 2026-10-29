import {
  isWorkMode,
  type SessionRecord,
  type TimeCategory,
  type TimerMode,
} from '../types'

/** Totals for the four tracked time buckets, all in seconds. */
export interface CategoryTotals {
  working: number
  overworking: number
  breaking: number
  overbreaking: number
}

/** A single day's worth of aggregated time plus session count. */
export interface DailyBucket extends CategoryTotals {
  /** Local calendar day, midnight, epoch ms. Use for the x-axis. */
  date: number
  /** Number of sessions that ended on this day. */
  sessions: number
}

/** The full analytics summary consumed by the page. */
export interface AnalyticsSummary {
  totals: CategoryTotals
  /** Grand total across all four categories, seconds. */
  totalSeconds: number
  /** Number of recorded sessions. */
  sessionCount: number
  /** Work sessions that reached the bell. */
  completedPomodoros: number
  /** Per-mode session counts. */
  byMode: Record<TimerMode, number>
  /** Chronological daily buckets covering the requested range. */
  daily: DailyBucket[]
  /** Longest run of consecutive days with at least one work session. */
  longestStreak: number
  /** Current ongoing streak ending today (or yesterday). */
  currentStreak: number
  /** Average focus (working + overworking) per active day, seconds. */
  avgFocusPerDay: number
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Normalize an epoch ms to the start of its local calendar day. */
function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const emptyTotals = (): CategoryTotals => ({
  working: 0,
  overworking: 0,
  breaking: 0,
  overbreaking: 0,
})

/**
 * Split one record into its category contributions. Work sessions feed
 * working/overworking; breaks feed breaking/overbreaking. The main phase and
 * the post-bell overtime are counted separately.
 */
export function categorize(record: SessionRecord): CategoryTotals {
  const totals = emptyTotals()
  if (isWorkMode(record.mode)) {
    totals.working += record.activeSeconds
    totals.overworking += record.overtimeSeconds
  } else {
    totals.breaking += record.activeSeconds
    totals.overbreaking += record.overtimeSeconds
  }
  return totals
}

function addInto(target: CategoryTotals, source: CategoryTotals): void {
  target.working += source.working
  target.overworking += source.overworking
  target.breaking += source.breaking
  target.overbreaking += source.overbreaking
}

/** Seconds of focus (main work + overwork) in a bucket of totals. */
export function focusSeconds(t: CategoryTotals): number {
  return t.working + t.overworking
}

/** Sum of all four categories. */
export function sumCategories(t: CategoryTotals): number {
  return t.working + t.overworking + t.breaking + t.overbreaking
}

/**
 * Build the day-by-day series for the last `days` calendar days (inclusive of
 * today), filling empty days with zeroes so charts render a continuous axis.
 */
function buildDaily(records: readonly SessionRecord[], days: number): DailyBucket[] {
  const today = startOfDay(Date.now())
  const start = today - (days - 1) * DAY_MS

  const buckets = new Map<number, DailyBucket>()
  for (let i = 0; i < days; i++) {
    const date = start + i * DAY_MS
    buckets.set(date, { date, sessions: 0, ...emptyTotals() })
  }

  for (const rec of records) {
    const day = startOfDay(rec.endedAt)
    const bucket = buckets.get(day)
    if (!bucket) continue // outside the window
    bucket.sessions += 1
    addInto(bucket, categorize(rec))
  }

  return Array.from(buckets.values()).sort((a, b) => a.date - b.date)
}

/**
 * Compute the longest and current streaks of consecutive days containing at
 * least one work (pomodoro) session.
 */
function computeStreaks(records: readonly SessionRecord[]): {
  longest: number
  current: number
} {
  const workDays = new Set<number>()
  for (const rec of records) {
    if (isWorkMode(rec.mode)) workDays.add(startOfDay(rec.endedAt))
  }
  if (workDays.size === 0) return { longest: 0, current: 0 }

  const sorted = Array.from(workDays).sort((a, b) => a - b)
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] - sorted[i - 1] === DAY_MS ? run + 1 : 1
    if (run > longest) longest = run
  }

  // Current streak: count back from today (or yesterday) while days are present.
  const today = startOfDay(Date.now())
  let cursor = workDays.has(today) ? today : today - DAY_MS
  let current = 0
  while (workDays.has(cursor)) {
    current += 1
    cursor -= DAY_MS
  }

  return { longest, current }
}

/**
 * Aggregate raw session records into everything the analytics page needs.
 * Pure and side-effect free so it is trivial to test and memoize.
 */
export function summarize(
  records: readonly SessionRecord[],
  days = 30,
): AnalyticsSummary {
  const totals = emptyTotals()
  const byMode: Record<TimerMode, number> = {
    pomodoro: 0,
    shortBreak: 0,
    longBreak: 0,
  }
  let completedPomodoros = 0

  for (const rec of records) {
    addInto(totals, categorize(rec))
    byMode[rec.mode] += 1
    if (isWorkMode(rec.mode) && rec.completed) completedPomodoros += 1
  }

  const daily = buildDaily(records, days)
  const { longest, current } = computeStreaks(records)

  const activeDays = daily.filter((d) => focusSeconds(d) > 0).length
  const totalFocus = focusSeconds(totals)
  const avgFocusPerDay = activeDays > 0 ? totalFocus / activeDays : 0

  return {
    totals,
    totalSeconds: sumCategories(totals),
    sessionCount: records.length,
    completedPomodoros,
    byMode,
    daily,
    longestStreak: longest,
    currentStreak: current,
    avgFocusPerDay,
  }
}

/** Order used consistently across charts/legends. */
export const CATEGORY_ORDER: TimeCategory[] = [
  'working',
  'overworking',
  'breaking',
  'overbreaking',
]

/**
 * Bottom-to-top order for the stacked bars: the two regular categories sit at
 * the base and the two overtime categories collect on top, so overtime always
 * reads as a single hatched band capping each column.
 */
export const STACK_ORDER: TimeCategory[] = [
  'working',
  'breaking',
  'overworking',
  'overbreaking',
]

/** One day in a contribution-style heatmap. */
export interface HeatmapDay {
  /** Local calendar day, midnight, epoch ms. */
  date: number
  /** Focus seconds (work + overwork) logged that day. */
  focus: number
  /** Number of sessions that ended that day. */
  sessions: number
}

/**
 * Per-day focus totals for the last `days` days (default a full year), oldest
 * first, with empty days filled in. Feeds the GitHub-style streak heatmap.
 */
export function buildHeatmap(
  records: readonly SessionRecord[],
  days = 364,
): HeatmapDay[] {
  const today = startOfDay(Date.now())
  const start = today - (days - 1) * DAY_MS

  const map = new Map<number, HeatmapDay>()
  for (let i = 0; i < days; i++) {
    const date = start + i * DAY_MS
    map.set(date, { date, focus: 0, sessions: 0 })
  }

  for (const rec of records) {
    const day = startOfDay(rec.endedAt)
    const bucket = map.get(day)
    if (!bucket) continue
    bucket.sessions += 1
    if (isWorkMode(rec.mode)) {
      bucket.focus += rec.activeSeconds + rec.overtimeSeconds
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date - b.date)
}
