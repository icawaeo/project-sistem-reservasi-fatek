// ============================================================
// Service Worker — Sistem Reservasi Ruangan Fatek UNSRAT (PWA)
// ============================================================

const CACHE_VERSION = 'v1';
const STATIC_CACHE  = `static-cache-${CACHE_VERSION}`;
const PAGES_CACHE   = `pages-cache-${CACHE_VERSION}`;
const IMAGE_CACHE   = `image-cache-${CACHE_VERSION}`;
const FONT_CACHE    = `font-cache-${CACHE_VERSION}`;
const API_CACHE     = `api-cache-${CACHE_VERSION}`;

// Assets to pre-cache on install
const PRE_CACHE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/Logo_Fatek_Unsrat.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── Install ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker…');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
  // Activate new SW immediately
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker…');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old versioned caches
            return (
              name.startsWith('static-cache-') ||
              name.startsWith('pages-cache-') ||
              name.startsWith('image-cache-') ||
              name.startsWith('font-cache-') ||
              name.startsWith('api-cache-')
            ) && !name.endsWith(CACHE_VERSION);
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
  // Notify all clients about the update
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
    });
  });
});

// ─── Fetch Strategy Router ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension, webpack HMR, and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Skip Next.js HMR / dev-mode requests
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // ── Google Fonts → Cache First (long-lived) ──
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE, 365 * 24 * 60 * 60));
    return;
  }

  // ── Static assets (_next/static) → Cache First ──
  if (url.pathname.startsWith('/_next/static')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, 30 * 24 * 60 * 60));
    return;
  }

  // ── Image files → Cache First ──
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|avif)$/) ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/uploads/')
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // ── API routes → Network First ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 60 * 60));
    return;
  }

  // ── HTML pages → Network First with offline fallback ──
  if (
    request.headers.get('accept')?.includes('text/html') ||
    request.mode === 'navigate'
  ) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // ── Everything else → Stale While Revalidate ──
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// ─── Cache First Strategy ───────────────────────────────────
async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cached = await caches.match(request);
  if (cached) {
    // Check if cache is still fresh
    const dateHeader = cached.headers.get('sw-cache-date');
    if (dateHeader) {
      const cacheAge = (Date.now() - new Date(dateHeader).getTime()) / 1000;
      if (cacheAge > maxAgeSeconds) {
        // Cache expired, fetch fresh copy in background
        fetchAndCache(request, cacheName);
      }
    }
    return cached;
  }
  return fetchAndCache(request, cacheName);
}

// ─── Network First Strategy ─────────────────────────────────
async function networkFirst(request, cacheName, maxAgeSeconds) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const cloned = response.clone();
      const headers = new Headers(cloned.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      const body = await cloned.blob();
      const cachedResponse = new Response(body, {
        status: cloned.status,
        statusText: cloned.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─── Network First with Offline Fallback ────────────────────
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return offline page as last resort
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ─── Stale While Revalidate Strategy ────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetchAndCache(request, cacheName).catch(() => {
    return cached || new Response('', { status: 503, statusText: 'Service Unavailable' });
  });
  return cached || fetchPromise;
}

// ─── Helper: Fetch and Cache ────────────────────────────────
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const cloned = response.clone();
      const headers = new Headers(cloned.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      const body = await cloned.blob();
      const cachedResponse = new Response(body, {
        status: cloned.status,
        statusText: cloned.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─── Background Sync for Reservations ───────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reservations') {
    event.waitUntil(syncReservations());
  }
});

async function syncReservations() {
  try {
    // Open IndexedDB to get queued reservation requests
    const db = await openDB();
    const tx = db.transaction('pending-reservations', 'readonly');
    const store = tx.objectStore('pending-reservations');
    const requests = await getAllFromStore(store);

    for (const item of requests) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });
        if (response.ok) {
          // Remove from queue on success
          const deleteTx = db.transaction('pending-reservations', 'readwrite');
          deleteTx.objectStore('pending-reservations').delete(item.id);
        }
      } catch (e) {
        console.log('[SW] Sync failed for item:', item.id, e);
      }
    }
  } catch (e) {
    console.log('[SW] Background sync error:', e);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pwa-reservasi-db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-reservations')) {
        db.createObjectStore('pending-reservations', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Listen for messages from the app ───────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(PAGES_CACHE).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }
});
