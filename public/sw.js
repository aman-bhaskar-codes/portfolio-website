// ═══════════════════════════════════════════════════════════
// ANTIGRAVITY OS v3 — Service Worker (§43)
// ═══════════════════════════════════════════════════════════
//
// Caching strategies per resource type:
//   Static (JS, CSS, fonts):  Cache First → always fast
//   Pages (/, /projects):     Stale While Revalidate → fast + fresh
//   API: /api/github:         Network First → real data when online
//   API: /api/chat:           Network Only → AI chat requires connection
//   Images:                   Cache First, 30-day TTL
//   Offline fallback:         Serve /offline page

const CACHE_VERSION = "antigravity-v3.0";
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
];

// ── INSTALL ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Some static assets failed to cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ── FETCH ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network Only: AI chat and SSE streams must be live
  if (
    url.pathname.startsWith("/api/chat") ||
    url.pathname.startsWith("/api/v2/") ||
    url.pathname.includes("/stream")
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            response: "I need an internet connection to chat. Please reconnect!",
            offline: true,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // Network First: API data endpoints
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || new Response("{}", {
              headers: { "Content-Type": "application/json" },
            });
          });
        })
    );
    return;
  }

  // Cache First: Static assets (JS, CSS, images, fonts)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Stale While Revalidate: HTML pages
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // If network fails and no cache, serve offline page
          return caches.match("/offline");
        });
      return cached || fetchPromise;
    })
  );
});
