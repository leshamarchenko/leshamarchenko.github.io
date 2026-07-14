const CACHE_PREFIX = "am-portfolio";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-v2`;
const MEDIA_CACHE = `${CACHE_PREFIX}-media-v2`;
const OFFLINE_PAGE = "./index.html";

const SHELL_ASSETS = [
  "./",
  OFFLINE_PAGE,
  "./404.html",
  "./style.css?v=2",
  "./script.js?v=2",
  "./favicon.svg",
  "./manifest.webmanifest",
  "./assets/fonts/AzeretMono-Regular.ttf",
  "./assets/posters/optimized/yapay-640.webp",
  "./assets/posters/optimized/yapay-1280.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== MEDIA_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirstNavigation(request) {
  const networkRequest = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(SHELL_CACHE);
        await cache.put(OFFLINE_PAGE, response.clone());
      }
      return response;
    })
    .catch(() => null);

  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve(null), 4500);
  });

  return (await Promise.race([networkRequest, timeout])) || (await caches.match(OFFLINE_PAGE)) || Response.error();
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(update);
    return cached;
  }

  return (await update) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Keep video range requests on the network for reliable Safari seeking.
  if (request.destination === "video" || request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (["style", "script", "font", "manifest"].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});
