/* PomPom service worker.
 *
 * Responsibilities:
 *  - Make the app installable + usable offline via a small runtime cache.
 *  - Display idle-reminder notifications on behalf of the page
 *    (registration.showNotification), which is what lets notifications work
 *    when the app is installed / running standalone.
 *  - Focus (or open) the app window when a notification is clicked.
 *
 * Note: a static service worker cannot wake itself on a schedule while the tab
 * is closed. Reminder timing is driven by the page while it is open; the SW is
 * the surface that renders the notification.
 */

const CACHE = 'pompom-v1'
// The app shell. Hashed build assets are cached at runtime on first fetch.
const APP_SHELL = ['./', './index.html', './manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network first, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
          return res
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('./index.html')),
        ),
    )
    return
  }

  // Other GETs (assets): cache first, then network, and cache the result.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => cached)
    }),
  )
})

// The page asks the SW to show a notification via postMessage so a single code
// path works whether or not the app is installed.
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'show-notification') return
  const { title, options } = data
  self.registration
    .showNotification(title || 'PomPom', options || {})
    .catch(() => undefined)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing PomPom window if one is open.
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }
        // Otherwise open a fresh one at the app scope.
        if (self.clients.openWindow) {
          return self.clients.openWindow('./')
        }
        return undefined
      }),
  )
})
