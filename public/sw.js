const CACHE_NAME = "runas-tools-runtime-v2"
const MAX_CACHE_ENTRIES = 80
const BASE_URL = new URL("./", self.location.href)
const OFFLINE_URL = new URL("./", BASE_URL).href
const APP_SHELL = [
  "./",
  "./calculadora-dano/",
  "./calculadora-testes/",
  "./galeria-personagens/",
  "./manifest.webmanifest",
  "./icon.png",
].map((path) => new URL(path, BASE_URL).href)

async function trimCache(cache) {
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_CACHE_ENTRIES)).map((key) => cache.delete(key)))
}

async function cacheResponse(request, response) {
  if (!response || !response.ok) return response
  const cache = await caches.open(CACHE_NAME)
  await cache.put(request, response.clone())
  await trimCache(cache)
  return response
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
    .then(() => self.clients.claim()))
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(fetch(request)
      .then((response) => cacheResponse(request, response))
      .catch(async () => (await caches.match(request)) ?? caches.match(OFFLINE_URL)))
    return
  }

  if (url.pathname.includes("/_next/static/") || ["script", "style", "image", "font"].includes(request.destination)) {
    event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request).then((response) => cacheResponse(request, response))))
    return
  }

  event.respondWith(fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => caches.match(request)))
})
