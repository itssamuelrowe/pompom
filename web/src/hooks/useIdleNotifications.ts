import { useCallback, useEffect, useRef, useState } from 'react'
import { randomFunnyReminder } from '../reminders'

type PermissionState = NotificationPermission | 'unsupported'

interface UseIdleNotificationsArgs {
  /** Master on/off switch (from settings). */
  enabled: boolean
  /** Minutes between idle reminders. */
  intervalMinutes: number
  /** Fixed reminder body text (used when `funny` is false). */
  message: string
  /** Use a random funny message for each reminder instead of `message`. */
  funny: boolean
  /** Whether the countdown is actively running; idle reminders pause when true. */
  timerRunning: boolean
}

function currentPermission(): PermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

/**
 * Sends browser notifications nudging the user back to focus:
 *  - On a fixed interval while the page is open but the timer isn't running.
 *  - On demand (e.g. when a session ends) via the returned `notify`.
 *
 * Messages can be a fixed string or a random funny quip. Notifications are
 * shown through the service worker when available (reliable in installed /
 * standalone mode), falling back to the page-level Notification API.
 */
export function useIdleNotifications({
  enabled,
  intervalMinutes,
  message,
  funny,
  timerRunning,
}: UseIdleNotificationsArgs) {
  const [permission, setPermission] = useState<PermissionState>(() =>
    currentPermission(),
  )

  // Keep the newest config readable from interval / event callbacks.
  const messageRef = useRef(message)
  const funnyRef = useRef(funny)
  useEffect(() => {
    messageRef.current = message
  }, [message])
  useEffect(() => {
    funnyRef.current = funny
  }, [funny])

  /** Ask the browser for notification permission (requires a user gesture). */
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported')
      return 'unsupported' as PermissionState
    }
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch {
      // Older browsers reject the promise form; fall back to current value.
      const fallback = currentPermission()
      setPermission(fallback)
      return fallback
    }
  }, [])

  /** Low-level: display a notification with the given body + de-dupe tag. */
  const showNotification = useCallback(
    async (body: string, tag: string) => {
      if (typeof Notification === 'undefined') return
      if (Notification.permission !== 'granted') return

      const title = 'PomPom'
      const options: NotificationOptions = {
        body,
        tag,
        icon: `${import.meta.env.BASE_URL}icon-192.png`,
        badge: `${import.meta.env.BASE_URL}icon-192.png`,
      }

      // Prefer the service worker: it reliably displays notifications when the
      // app is installed / standalone, and some browsers (notably mobile
      // Chrome) refuse `new Notification()` once a SW controls the page.
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg) {
            await reg.showNotification(title, options)
            return
          }
        } catch {
          // Fall through to the page-level notification below.
        }
      }

      try {
        const n = new Notification(title, options)
        n.onclick = () => {
          window.focus()
          n.close()
        }
      } catch {
        // Construction can throw in some environments; ignore silently.
      }
    },
    [],
  )

  /** Resolve the body for a reminder based on the funny setting. */
  const resolveBody = useCallback((override?: string) => {
    if (override) return override
    return funnyRef.current ? randomFunnyReminder() : messageRef.current
  }, [])

  /** Fire a one-off reminder now (e.g. a session just ended). */
  const notify = useCallback(
    (override?: string) =>
      void showNotification(resolveBody(override), 'pompom-reminder'),
    [showNotification, resolveBody],
  )

  // The idle reminder loop. Active only when enabled, permitted, and the timer
  // is not running. Restarts whenever any of those inputs change.
  useEffect(() => {
    if (!enabled) return
    if (timerRunning) return
    if (permission !== 'granted') return

    const ms = Math.max(1, intervalMinutes) * 60 * 1000
    const id = window.setInterval(() => {
      void showNotification(resolveBody(), 'pompom-idle-reminder')
    }, ms)
    return () => window.clearInterval(id)
  }, [enabled, timerRunning, permission, intervalMinutes, showNotification, resolveBody])

  return { permission, requestPermission, notify }
}
