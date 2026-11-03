/* Sofia Travel Management System — Web Push & Mobile PWA Service Worker Handler */

self.addEventListener('install', () => {
  if (typeof self.skipWaiting === 'function') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  if (self.clients && typeof self.clients.claim === 'function') {
    event.waitUntil(self.clients.claim());
  }
});

function buildNotificationOptions(payload) {
  const isAr = payload.lang === 'ar' || payload.dir === 'rtl';
  return {
    body: payload.body || payload.message || '',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag: payload.tag || payload.id || ('sofia-push-' + Date.now()),
    renotify: payload.renotify !== false,
    requireInteraction: Boolean(payload.requireInteraction),
    vibrate: Array.isArray(payload.vibrate) ? payload.vibrate : [200, 100, 200],
    dir: payload.dir || (isAr ? 'rtl' : 'ltr'),
    lang: payload.lang || (isAr ? 'ar' : 'en'),
    timestamp: payload.timestamp || Date.now(),
    data: {
      url: payload.url || '/',
      tab: payload.tab || 'notifications',
      notificationId: payload.id || payload.tag || '',
    },
    actions: Array.isArray(payload.actions)
      ? payload.actions
      : [
          {
            action: 'open',
            title: isAr ? 'فتح التطبيق' : 'Open App',
          },
        ],
  };
}

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Sofia Travel',
    body: 'You have a new notification.',
    url: '/',
    tab: 'notifications',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed && typeof parsed === 'object') {
        payload = Object.assign({}, payload, parsed);
      }
    } catch {
      try {
        payload.body = event.data.text();
      } catch {}
    }
  }

  const title = payload.title || 'Sofia Travel';
  const options = buildNotificationOptions(payload);

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = (event.notification && event.notification.data) || {};
  const targetTab = data.tab || 'notifications';
  const targetUrl = data.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client && 'focus' in client) {
            try {
              client.postMessage({
                type: 'SOFIA_PUSH_CLICK',
                tab: targetTab,
                url: targetUrl,
                notificationId: data.notificationId || '',
              });
            } catch {}
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          const openTarget =
            targetTab && targetUrl === '/' ? `/?tab=${encodeURIComponent(targetTab)}` : targetUrl;
          return self.clients.openWindow(openTarget);
        }
        return undefined;
      })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING' && typeof self.skipWaiting === 'function') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'SHOW_PHONE_NOTIFICATION' && data.payload) {
    const payload = data.payload;
    const title = payload.title || 'Sofia Travel';
    const options = buildNotificationOptions(payload);
    if (event.waitUntil) {
      event.waitUntil(self.registration.showNotification(title, options));
    } else {
      self.registration.showNotification(title, options);
    }
  }
});
