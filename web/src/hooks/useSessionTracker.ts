import { useCallback, useMemo, useSyncExternalStore } from 'react'
import {
  sessionTracker,
  type SessionInput,
  type SessionTracker,
} from '../analytics/SessionTracker'
import type { SessionRecord } from '../types'

/**
 * Subscribe a component to the shared {@link SessionTracker}. Uses
 * `useSyncExternalStore` so React re-renders exactly when the record set
 * changes, with no duplicated state or manual effect wiring.
 *
 * A specific tracker can be injected (handy for tests/storybook); defaults to
 * the app-wide singleton.
 */
export function useSessionTracker(tracker: SessionTracker = sessionTracker) {
  const records = useSyncExternalStore<readonly SessionRecord[]>(
    tracker.subscribe,
    tracker.getRecords,
    tracker.getRecords,
  )

  const record = useCallback(
    (input: SessionInput) => tracker.record(input),
    [tracker],
  )
  const remove = useCallback((id: string) => tracker.remove(id), [tracker])
  const clear = useCallback(() => tracker.clear(), [tracker])

  return useMemo(
    () => ({ records, record, remove, clear }),
    [records, record, remove, clear],
  )
}
