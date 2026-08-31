const RA2WEB_SW_VERSION = "0.86.4-rbd84169-d09cd7d2a";
const RA2WEB_APP_CACHE = "ra2web-app-" + RA2WEB_SW_VERSION;
const RA2WEB_GAMERES_CACHE = "ra2web-gameres-" + RA2WEB_SW_VERSION;
const RA2WEB_PRECACHE_URLS = ["/","/index.html","/manifest.webmanifest","/js/app.js?v=0.86.4-rbd84169-d09cd7d2a","/js/vendor.js?v=0.86.4-rbd84169-d09cd7d2a","/res/werhdexp.mix?v=0.86.4-rbd84169-d09cd7d2a","/config.ini?v=0.86.4-rbd84169-d09cd7d2a","/res/overlay/art.ini?v=0.86.4","/res/overlay/modcd.ini?v=0.86.4","/res/overlay/mpbattle.ini?v=0.86.4","/res/overlay/mpcoop.ini?v=0.86.4","/res/overlay/mpduel.ini?v=0.86.4","/res/overlay/mpfreeforallmd.ini?v=0.86.4","/res/overlay/mpmeat.ini?v=0.86.4","/res/overlay/mpmodes.ini?v=0.86.4","/res/overlay/mpmw.ini?v=0.86.4","/res/overlay/mpnaval.ini?v=0.86.4","/res/overlay/mpspecial.ini?v=0.86.4","/res/overlay/mpteammd.ini?v=0.86.4","/res/overlay/mpunholy.ini?v=0.86.4","/res/overlay/nodogengikills.ini?v=0.86.4","/res/overlay/ra2.csf?v=0.86.4","/res/overlay/rules.ini?v=0.86.4","/res/overlay/soundcd.ini?v=0.86.4","/res/overlay/ui.ini?v=0.86.4"];
const RA2WEB_IMMUTABLE_PREFIXES = ["/js/"];
const RA2WEB_STATIC_PREFIXES = ["/res/fonts/"];
const RA2WEB_UPDATE_SENSITIVE_PATHS = new Set(["/config.ini","/servers.ini","/mods.ini","/res/mods.ini","/official-map-redirect.json","/old/versions.json","/version.json"]);
const RA2WEB_GAMERES_PREFIXES = ["/v2/","/map/","/mod/","/music/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(RA2WEB_APP_CACHE).then((cache) =>
      cache.addAll(RA2WEB_PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" }))),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      notifyClients({ type: "RA2WEB_SW_UPDATE_READY", version: RA2WEB_SW_VERSION }),
    ]),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "RA2WEB_SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === "RA2WEB_GET_VERSION") {
    event.ports[0]?.postMessage({ type: "RA2WEB_SW_VERSION", version: RA2WEB_SW_VERSION });
    return;
  }
  if (event.data?.type === "RA2WEB_GENERATION_BOOTED") {
    event.waitUntil(cleanupOldCaches());
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/old/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, RA2WEB_APP_CACHE));
    return;
  }

  if (url.pathname.startsWith("/res/overlay/") || RA2WEB_UPDATE_SENSITIVE_PATHS.has(url.pathname)) {
    event.respondWith(networkFirst(request, RA2WEB_APP_CACHE));
    return;
  }

  if (startsWithAny(url.pathname, RA2WEB_IMMUTABLE_PREFIXES) && isVersionedResource(url)) {
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
  return url.searchParams.has("h") || url.searchParams.has("v");
}
