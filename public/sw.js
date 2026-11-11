/* Linkly service worker.
 * Caches the app shell and hashed build assets so the app opens offline.
 * It never touches /api, short links, bio pages or auth callbacks, so redirects, click counting
 * and private data always come straight from the network. */
const VERSION = "v1";
const SHELL = `linkly-shell-${VERSION}`;
const ASSETS = `linkly-assets-${VERSION}`;
const MAX_ASSETS = 120;

// Only these single-page-app routes are answered from the shell. Everything else (short links, /b/*) passes through.
const APP_ROUTE = /^\/(?:$|login$|links(?:\/[^/]+)?$|collections$|bio$|settings$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await cache.addAll(["/offline.html", "/icons/icon-192.png", "/favicon.svg"]);
      try {
        const shell = await fetch("/", { cache: "reload" });
        if (shell.ok) await cache.put("/", shell);
      } catch {
        /* the shell is cached on first successful navigation instead */
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, ASSETS]);
      for (const key of await caches.keys()) if (key.startsWith("linkly-") && !keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    if (response.ok && response.headers.get("content-type")?.includes("text/html")) cache.put("/", response.clone());
    return response;
  } catch {
    return (await cache.match("/")) || (await cache.match("/offline.html")) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
    trim(ASSETS, MAX_ASSETS);
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => hit);
  return hit || refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (APP_ROUTE.test(url.pathname) && !url.searchParams.has("nosw")) event.respondWith(networkFirstShell(request));
    return;
  }
  if (url.pathname.startsWith("/assets/")) return void event.respondWith(cacheFirst(request));
  if (url.pathname.startsWith("/icons/") || url.pathname === "/favicon.svg" || url.pathname === "/manifest.webmanifest") {
    event.respondWith(staleWhileRevalidate(request));
  }
});
