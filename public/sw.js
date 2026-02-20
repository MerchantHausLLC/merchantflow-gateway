// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = { title: 'New Message', body: 'You have a new message' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }
  
  // Use absolute URL for icons - required for Windows & Android notifications
  const baseUrl = self.location.origin;
  const iconUrl = data.icon ? (data.icon.startsWith('http') ? data.icon : `${baseUrl}${data.icon}`) : `${baseUrl}/favicon.png`;
  const badgeUrl = data.badge ? (data.badge.startsWith('http') ? data.badge : `${baseUrl}${data.badge}`) : `${baseUrl}/favicon.png`;

  const options = {
    body: data.body,
    icon: iconUrl,
    badge: badgeUrl,
    image: data.image || undefined,
    vibrate: [200, 100, 200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: true,
    tag: data.data?.messageId || 'chat-notification',
    renotify: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/chat';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
