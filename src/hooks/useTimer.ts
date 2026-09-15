import { useCallback, useEffect, useRef, useState } from 'react'
import type { TimerMode, TimerStatus } from '../types'

interface UseTimerArgs {
  /** Duration in seconds for the current mode. */
  durationSeconds: number
  mode: TimerMode
  onComplete: () => void
}

/**
 * A timestamp-based countdown. Remaining time is always derived from
 * `endTime - now`, so browser throttling of the tick interval never causes
 * drift. The interval only exists to refresh the displayed value.
 */
export function useTimer({ durationSeconds, mode, onComplete }: UseTimerArgs) {
  const [status, setStatus] = useState<TimerStatus>('IDLE')
  const [remaining, setRemaining] = useState(durationSeconds)

  const endTimeRef = useRef<number | null>(null)
  const remainingRef = useRef(durationSeconds)
  const intervalRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const computeRemaining = useCallback(() => {
    if (endTimeRef.current === null) return remainingRef.current
    const secs = Math.max(0, (endTimeRef.current - Date.now()) / 1000)
    return secs
  }, [])

  const tick = useCallback(() => {
    const secs = computeRemaining()
    remainingRef.current = secs
    setRemaining(secs)
    if (secs <= 0) {
      clearTick()
      endTimeRef.current = null
      remainingRef.current = 0
      setStatus('COMPLETED')
      onCompleteRef.current()
    }
  }, [computeRemaining, clearTick])

  const start = useCallback(() => {
    setStatus((prev) => {
      if (prev === 'RUNNING') return prev
      // Resume from whatever time is left (or full duration if idle/completed).
      const base =
        prev === 'PAUSED' ? remainingRef.current : durationSeconds
      endTimeRef.current = Date.now() + base * 1000
      remainingRef.current = base
      setRemaining(base)
      clearTick()
      intervalRef.current = window.setInterval(tick, 250)
      return 'RUNNING'
    })
  }, [durationSeconds, tick, clearTick])

  const pause = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'RUNNING') return prev
      remainingRef.current = computeRemaining()
      setRemaining(remainingRef.current)
      endTimeRef.current = null
      clearTick()
      return 'PAUSED'
    })
  }, [computeRemaining, clearTick])

  const reset = useCallback(() => {
    clearTick()
    endTimeRef.current = null
    remainingRef.current = durationSeconds
    setRemaining(durationSeconds)
    setStatus('IDLE')
  }, [durationSeconds, clearTick])

  /** Force the timer to a fresh IDLE state for a (possibly new) duration. */
  const resetTo = useCallback(
    (seconds: number) => {
      clearTick()
      endTimeRef.current = null
      remainingRef.current = seconds
      setRemaining(seconds)
      setStatus('IDLE')
    },
    [clearTick],
  )

  const markRinging = useCallback(() => setStatus('RINGING'), [])

  // Keep the displayed remaining time in sync when the duration changes while
  // the timer is idle (e.g. the user edits the current mode's duration).
  useEffect(() => {
    setStatus((prev) => {
      if (prev === 'IDLE') {
        endTimeRef.current = null
        remainingRef.current = durationSeconds
        setRemaining(durationSeconds)
      }
      return prev
    })
  }, [durationSeconds, mode])

  // Re-sync immediately when the tab becomes visible again after throttling.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && intervalRef.current) {
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [tick])

  useEffect(() => () => clearTick(), [clearTick])

  return {
    status,
    remaining,
    start,
    pause,
    reset,
    resetTo,
    markRinging,
  }
}
