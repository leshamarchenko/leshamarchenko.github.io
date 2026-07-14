const CACHE_NAME = "am-portfolio-shell-v1";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./style.css",
  "./script.js",
  "./assets/fonts/AzeretMono-Regular.ttf",
  "./assets/posters/yapay.mp4.png",
  "./assets/posters/t2-30.mp4.png",
  "./assets/posters/5ka-vip.mp4.png",
  "./assets/posters/bk-test.mp4.png",
  "./assets/posters/t2-15.mp4.png",
  "./assets/posters/yandex-stickers-pay.png",
  "./assets/posters/yandex-food.png",
  "./assets/posters/timiryazevsky-park.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.destination === "video" || request.headers.has("range")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
