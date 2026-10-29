/**
 * Registers the service worker that powers offline support, installability and
 * notification display. Registration is skipped in dev to avoid stale-cache
 * surprises while iterating.
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`
    navigator.serviceWorker
      .register(swUrl, { scope: import.meta.env.BASE_URL })
      .catch(() => {
        // Registration failures are non-fatal; the app still works online.
      })
  })
}
