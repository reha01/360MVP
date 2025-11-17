// src/sw.ts
// Service Worker with cache busting and forced updates

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// Cache version - bump this to force cache invalidation
const CACHE_VERSION = 'v2025-09-23-a';
const RUNTIME_CACHE = `360mvp-runtime-${CACHE_VERSION}`;
const STATIC_CACHE = `360mvp-static-${CACHE_VERSION}`;

console.log(`[360MVP] SW: updated to ${CACHE_VERSION}`);

// Force update and skip waiting
self.addEventListener('install', (event) => {
  console.log(`[360MVP] SW: Installing version ${CACHE_VERSION}`);
  self.skipWaiting();
});

// Take control of all clients immediately
self.addEventListener('activate', (event) => {
  console.log(`[360MVP] SW: Activating version ${CACHE_VERSION}`);
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('360mvp-') && 
        !name.includes(CACHE_VERSION)
      );
      
      if (oldCaches.length > 0) {
        console.log(`[360MVP] SW: Cleaning up ${oldCaches.length} old caches:`, oldCaches);
        await Promise.all(oldCaches.map(cache => caches.delete(cache)));
      }
      
      // Take control of all clients
      await self.clients.claim();
      console.log(`[360MVP] SW: Version ${CACHE_VERSION} is now controlling all clients`);
    })()
  );
});

// Handle skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[360MVP] SW: Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Precache and route static assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
cleanupOutdatedCaches();

// Cache strategies for different types of resources

// API requests - Network first with fallback to cache
registerRoute(
  ({ request }) => request.url.includes('/api/') || request.url.includes('firebase'),
  new NetworkFirst({
    cacheName: RUNTIME_CACHE,
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}-${CACHE_VERSION}`;
        },
      },
    ],
  })
);

// Static assets - Cache first
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image',
  new CacheFirst({
    cacheName: STATIC_CACHE,
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}-${CACHE_VERSION}`;
        },
      },
    ],
  })
);

// Navigation requests - Network first with cache fallback
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: RUNTIME_CACHE,
    networkTimeoutSeconds: 3,
  })
);
registerRoute(navigationRoute);

// Notify clients about updates
self.addEventListener('controllerchange', () => {
  console.log('[360MVP] SW: Controller changed');
});

// Handle fetch errors gracefully
self.addEventListener('fetch', (event) => {
  // Only handle requests for our domain
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try to get from network first
        const response = await fetch(event.request);
        
        // If it's a navigation request and we get a valid response,
        // update the cache for offline use
        if (event.request.mode === 'navigate' && response.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(event.request, response.clone());
        }
        
        return response;
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(event.request);
        
        if (cachedResponse) {
          console.log(`[360MVP] SW: Serving cached response for ${event.request.url}`);
          return cachedResponse;
        }
        
        // If it's a navigation request and we don't have it cached,
        // return the main app shell
        if (event.request.mode === 'navigate') {
          const appShell = await caches.match('/');
          if (appShell) {
            return appShell;
          }
        }
        
        throw error;
      }
    })()
  );
});




























