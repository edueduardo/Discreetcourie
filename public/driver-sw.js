// Service Worker for Driver PWA
const CACHE_NAME = 'dc-driver-v1';
const OFFLINE_URL = '/driver/offline';

const DRIVER_ASSETS = [
  '/driver',
  '/driver/deliveries',
  '/driver/tracking',
  '/driver/proof',
  '/driver/navigate',
  '/manifest-driver.json'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Driver SW] Caching assets');
      return cache.addAll(DRIVER_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name.startsWith('dc-driver-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/driver')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Background sync for GPS data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-gps') {
    event.waitUntil(syncGPSData());
  }
  if (event.tag === 'sync-proof') {
    event.waitUntil(syncProofData());
  }
});

async function syncGPSData() {
  try {
    const db = await openDriverDB();
    const pending = await db.getAll('pending-gps');
    for (const data of pending) {
      await fetch('/api/gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await db.delete('pending-gps', data.id);
    }
  } catch (e) {
    console.error('[Driver SW] GPS sync failed:', e);
  }
}

async function syncProofData() {
  try {
    const db = await openDriverDB();
    const pending = await db.getAll('pending-proof');
    for (const data of pending) {
      await fetch(`/api/orders/${data.trackingCode}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await db.delete('pending-proof', data.id);
    }
  } catch (e) {
    console.error('[Driver SW] Proof sync failed:', e);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'DC Driver', body: 'New delivery assigned' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/driver' },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'navigate', title: 'Navigate' }
      ]
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/driver';

  if (event.action === 'navigate') {
    // Open navigation for the delivery
    event.waitUntil(clients.openWindow('/driver/navigate'));
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/driver') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// IndexedDB for offline storage
function openDriverDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dc-driver-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve({
      getAll: (store) => new Promise((res, rej) => {
        const tx = request.result.transaction(store, 'readonly');
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      }),
      delete: (store, key) => new Promise((res, rej) => {
        const tx = request.result.transaction(store, 'readwrite');
        const req = tx.objectStore(store).delete(key);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      }),
      add: (store, data) => new Promise((res, rej) => {
        const tx = request.result.transaction(store, 'readwrite');
        const req = tx.objectStore(store).add(data);
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      })
    });
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending-gps')) {
        db.createObjectStore('pending-gps', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-proof')) {
        db.createObjectStore('pending-proof', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

console.log('[Driver SW] Loaded');
