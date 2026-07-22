const RA2WEB_SW_VERSION = "0.83.1-r1999744-d9d91a698";
const RA2WEB_APP_CACHE = "ra2web-app-" + RA2WEB_SW_VERSION;
const RA2WEB_GAMERES_CACHE = "ra2web-gameres-" + RA2WEB_SW_VERSION;
const RA2WEB_IMMUTABLE_PREFIXES = ["/assets/releases/","/runtime/releases/","/res/werhd/releases/","/assets/releases/0.83.1-r1999744-d9d91a698/","/runtime/releases/0.83.1-r1999744-d9d91a698/"];
const RA2WEB_STATIC_PREFIXES = ["/lib/","/res/fonts/"];
const RA2WEB_UPDATE_SENSITIVE_PATHS = new Set(["/","/index.html","/config.ini","/servers.ini","/mods.ini","/res/mods.ini","/old/versions.json","/res/werhd/versions.json"]);
const RA2WEB_GAMERES_PREFIXES = ["/v2/","/map/","/mod/","/music/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(RA2WEB_APP_CACHE)
      .then((cache) => cache.add(new Request("/manifest.webmanifest", { cache: "reload" })))
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      cleanupOldCaches(),
      self.clients.claim(),
      notifyClients({ type: "RA2WEB_SW_UPDATE_READY", version: RA2WEB_SW_VERSION }),
    ]),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "RA2WEB_SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, RA2WEB_APP_CACHE));
    return;
  }

  if (RA2WEB_UPDATE_SENSITIVE_PATHS.has(url.pathname)) {
    event.respondWith(networkFirst(request, RA2WEB_APP_CACHE));
    return;
  }

  if (startsWithAny(url.pathname, RA2WEB_IMMUTABLE_PREFIXES)) {
    event.respondWith(cacheFirst(request, RA2WEB_APP_CACHE));
    return;
  }

  if (startsWithAny(url.pathname, RA2WEB_GAMERES_PREFIXES) && isVersionedResource(url)) {
    event.respondWith(cacheFirst(request, RA2WEB_GAMERES_CACHE));
    return;
  }

  if (startsWithAny(url.pathname, RA2WEB_STATIC_PREFIXES) || isVersionedResource(url)) {
    event.respondWith(cacheFirst(request, RA2WEB_APP_CACHE));
  }
});

async function cleanupOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith("ra2web-") && key !== RA2WEB_APP_CACHE && key !== RA2WEB_GAMERES_CACHE)
      .map((key) => caches.delete(key)),
  );
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  for (const client of clients) client.postMessage(message);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const fallback = await cache.match("/index.html");
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) await cache.put(request, response.clone());
  return response;
}

function isCacheable(response) {
  return response && response.ok && (response.type === "basic" || response.type === "cors");
}

function startsWithAny(pathname, prefixes) {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

function isVersionedResource(url) {
  return url.searchParams.has("h") || url.searchParams.has("v") || /\/releases\//.test(url.pathname);
}
