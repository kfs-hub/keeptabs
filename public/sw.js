// Keep Tabs - Web Push Service Worker
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const payload = event.data.json()
    const title = payload.title || 'Keep Tabs'
    const options = {
      body: payload.body || payload.message || 'You have a new update in your group.',
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      data: {
        url: payload.url || '/notifications',
      },
      vibrate: [100, 50, 100],
      tag: payload.tag || 'keep-tabs-notification',
      renotify: true,
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('Error handling push event:', err)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
