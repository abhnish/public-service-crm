const CACHE_NAME = 'smart-crm-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  // Core chunks (will be dynamically updated)
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  // Critical pages
  '/src/pages/Home.tsx',
  '/src/pages/Login.tsx',
  '/src/pages/Register.tsx',
  '/src/pages/SubmitComplaint.tsx',
  '/src/pages/MyComplaints.tsx',
  '/src/pages/Dashboard.tsx',
  '/src/pages/AdminDashboard.tsx',
  '/src/pages/OfficerDashboard.tsx',
  // Core components
  '/src/components/Navbar.tsx',
  '/src/components/ProtectedRoute.tsx',
  '/src/hooks/useAuth.tsx',
  // Services
  '/src/services/api.ts'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching core assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Skip API requests - let them fail naturally
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Service Worker: Serving from cache:', request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('Service Worker: Fetching from network:', request.url);
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch((error) => {
                console.warn('Service Worker: Failed to cache:', error);
              });

            return response;
          })
          .catch(() => {
            // If network fails and no cache, return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // For other requests, just fail
            throw new Error('Network request failed and no cache available');
          });
      })
      .catch((error) => {
        console.error('Service Worker: Fetch error:', error);
        throw error;
      })
  );
});

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
