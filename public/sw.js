self.addEventListener("install", (event) => {
  console.log("Service Worker installé");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activé");
  event.waitUntil(self.clients.claim());
});
const CACHE_NAME = "sunbassschool-cache-v1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/logo-192x192.png",
  "/logo-512x512.png",
];

// 🏗️ Installer le cache initial
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Mise en cache des fichiers...");
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// 🚀 Activer le Service Worker et nettoyer les vieux caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("🗑️ Suppression du vieux cache", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 🔄 Intercepter les requêtes et servir depuis le cache si hors-ligne
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
