import type { SessionRecord, TimerMode } from '../types'

/** localStorage key for the persisted session log (versioned). */
const STORAGE_KEY = 'pompom.sessions.v1'

/** Cap the stored history so localStorage can't grow without bound. */
const MAX_RECORDS = 1000

const VALID_MODES: TimerMode[] = ['pomodoro', 'shortBreak', 'longBreak']

/** A listener notified whenever the tracked session list changes. */
type Listener = (records: readonly SessionRecord[]) => void

/** Data needed to record a finished session. */
export interface SessionInput {
  mode: TimerMode
  plannedSeconds: number
  activeSeconds: number
  overtimeSeconds: number
  completed: boolean
}

/**
 * Pluggable persistence backend. Abstracting storage keeps {@link SessionTracker}
 * testable (inject an in-memory store) and lets the browser/localStorage
 * details live in one place.
 */
export interface SessionStore {
  read(): SessionRecord[]
  write(records: readonly SessionRecord[]): void
}

/** Coerce arbitrary parsed JSON into one clean record, or null if invalid. */
function sanitizeRecord(item: unknown, index: number): SessionRecord | null {
  if (!item || typeof item !== 'object') return null
  const r = item as Record<string, unknown>

  const endedAt = Number(r.endedAt)
  if (!Number.isFinite(endedAt)) return null

  const mode = VALID_MODES.includes(r.mode as TimerMode)
    ? (r.mode as TimerMode)
    : 'pomodoro'

  const num = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }

  return {
    id: typeof r.id === 'string' ? r.id : `${endedAt}-${index}`,
    mode,
    plannedSeconds: num(r.plannedSeconds),
    activeSeconds: num(r.activeSeconds),
    overtimeSeconds: num(r.overtimeSeconds),
    completed: typeof r.completed === 'boolean' ? r.completed : true,
    endedAt,
  }
}

/**
 * The default {@link SessionStore} backed by `localStorage`, guarded so a
 * private-mode / quota failure degrades to in-memory only rather than throwing.
 */
export class LocalStorageSessionStore implements SessionStore {
  private readonly key: string

  constructor(key: string = STORAGE_KEY) {
    this.key = key
  }

  read(): SessionRecord[] {
    try {
      const raw = localStorage.getItem(this.key)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      const out: SessionRecord[] = []
      parsed.forEach((item, i) => {
        const rec = sanitizeRecord(item, i)
        if (rec) out.push(rec)
      })
      return out
    } catch {
      return []
    }
  }

  write(records: readonly SessionRecord[]): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(records))
    } catch {
      // Storage unavailable -> keep working from memory for this session.
    }
  }
}

/**
 * Central source of truth for completed sessions.
 *
 * Design notes:
 * - **Observer pattern**: UI code subscribes via {@link subscribe}; the tracker
 *   notifies every listener when the record set changes. React binds to it with
 *   `useSyncExternalStore` (see `useSessionTracker`).
 * - **Dependency injection**: the persistence backend is a {@link SessionStore},
 *   so the class has no hard dependency on `localStorage` and stays testable.
 * - **Immutability**: records are exposed as a frozen snapshot and a new array
 *   reference is produced on every change, which lets `useSyncExternalStore`
 *   detect updates by identity.
 */
export class SessionTracker {
  private records: SessionRecord[]
  private snapshot: readonly SessionRecord[]
  private readonly listeners = new Set<Listener>()
  private readonly store: SessionStore
  private readonly maxRecords: number

  constructor(
    store: SessionStore = new LocalStorageSessionStore(),
    maxRecords: number = MAX_RECORDS,
  ) {
    this.store = store
    this.maxRecords = maxRecords
    // Newest first, matching the existing overtime log convention.
    this.records = store.read().sort((a, b) => b.endedAt - a.endedAt)
    this.snapshot = Object.freeze(this.records.slice())
  }

  /** Register a listener; returns an unsubscribe function. */
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Current immutable snapshot (stable reference until the next change). */
  getRecords = (): readonly SessionRecord[] => this.snapshot

  /**
   * Record a finished session. Runs shorter than a second with no overtime are
   * dropped as noise. Returns the created record (or null if ignored).
   */
  record(input: SessionInput): SessionRecord | null {
    const activeSeconds = Math.max(0, Math.round(input.activeSeconds))
    const overtimeSeconds = Math.max(0, Math.round(input.overtimeSeconds))
    if (activeSeconds < 1 && overtimeSeconds < 1) return null

    const entry: SessionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mode: input.mode,
      plannedSeconds: Math.max(0, Math.round(input.plannedSeconds)),
      activeSeconds,
      overtimeSeconds,
      completed: input.completed,
      endedAt: Date.now(),
    }

    this.records = [entry, ...this.records].slice(0, this.maxRecords)
    this.commit()
    return entry
  }

  /** Remove a single record by id. */
  remove(id: string): void {
    const next = this.records.filter((r) => r.id !== id)
    if (next.length === this.records.length) return
    this.records = next
    this.commit()
  }

  /** Wipe the entire session history. */
  clear(): void {
    if (this.records.length === 0) return
    this.records = []
    this.commit()
  }

  /** Persist, refresh the snapshot, and notify listeners. */
  private commit(): void {
    this.store.write(this.records)
    this.snapshot = Object.freeze(this.records.slice())
    for (const listener of this.listeners) listener(this.snapshot)
  }
}

/**
 * Shared singleton used by the running app. Tests can still instantiate their
 * own {@link SessionTracker} with a custom store.
 */
export const sessionTracker = new SessionTracker()
