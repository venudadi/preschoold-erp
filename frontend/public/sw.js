// Service Worker for Preschool ERP
// Provides offline support and caching for better performance

const CACHE_NAME = 'preschool-erp-v2.1.0';
const API_CACHE_NAME = 'preschool-erp-api-v2.1.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets as needed
];

// API endpoints to cache (for offline support)
const API_ENDPOINTS_TO_CACHE = [
  '/api/health',
  '/api/auth/verify',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error during install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticAssets(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses for specific endpoints
    if (networkResponse.ok && shouldCacheApiEndpoint(url.pathname)) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);

    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving API request from cache:', url.pathname);
      return cachedResponse;
    }

    // Return offline response for critical endpoints
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'OFFLINE',
          message: 'Service worker offline mode',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);

    // Cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to serve static asset:', request.url);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cachedResponse = await caches.match('/index.html');
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    throw error;
  }
}

// Check if API endpoint should be cached
function shouldCacheApiEndpoint(pathname) {
  return API_ENDPOINTS_TO_CACHE.some(endpoint => pathname.startsWith(endpoint));
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'portfolio-upload') {
    event.waitUntil(syncPortfolioUploads());
  }

  if (event.tag === 'attendance-sync') {
    event.waitUntil(syncAttendanceData());
  }
});

// Sync portfolio uploads when back online
async function syncPortfolioUploads() {
  try {
    console.log('[SW] Syncing portfolio uploads');
    // Implementation would depend on how offline uploads are stored
    // This is a placeholder for the actual sync logic
  } catch (error) {
    console.error('[SW] Failed to sync portfolio uploads:', error);
  }
}

// Sync attendance data when back online
async function syncAttendanceData() {
  try {
    console.log('[SW] Syncing attendance data');
    // Implementation would depend on how offline attendance is stored
    // This is a placeholder for the actual sync logic
  } catch (error) {
    console.error('[SW] Failed to sync attendance data:', error);
  }
}

// Handle push notifications (if implemented)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: 'You have new updates in Preschool ERP',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'preschool-erp-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.tag = data.tag || options.tag;
  }

  event.waitUntil(
    self.registration.showNotification('Preschool ERP', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});