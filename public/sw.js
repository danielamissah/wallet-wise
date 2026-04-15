// public/sw.js
const CACHE_NAME = "walletwise-v2";
const OFFLINE_URL = "/dashboard";

// Never cache API routes
const NO_CACHE = ["/api/", "/_next/", "/clerk/"];

self.addEventListener("install", (event) => {
  // Take over immediately without waiting
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/", "/dashboard", "/manifest.json"])
    )
  );
});

self.addEventListener("activate", (event) => {
  // Delete all old caches
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  // Skip non-GET and API/auth routes
  if (event.request.method !== "GET") return;
  if (NO_CACHE.some((p) => event.request.url.includes(p))) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, clone)
          );
        }
        return response;
      })
      .catch(() =>
        // Offline fallback
        caches.match(event.request).then(
          (cached) => cached || caches.match(OFFLINE_URL)
        )
      )
  );
});