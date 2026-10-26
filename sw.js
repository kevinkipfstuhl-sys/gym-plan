/* Service Worker: legt beim Installieren alle App-Dateien ab, danach läuft alles offline.
   Neue Version: VERSION erhöhen → App zeigt "Update verfügbar". */
const VERSION = "v3.0.0";
const CACHE = "gymplan-" + VERSION;
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "css/app.css",
  "data/exercises.js",
  "data/gear.js",
  "data/migration-map.js",
  "data/muscles.js",
  "data/workouts.js",
  "fonts/ClashDisplay-500.woff2",
  "fonts/ClashDisplay-600.woff2",
  "fonts/ClashDisplay-700.woff2",
  "fonts/Satoshi-400.woff2",
  "fonts/Satoshi-500.woff2",
  "fonts/Satoshi-700.woff2",
  "js/app.js",
  "js/body.js",
  "js/ctx.js",
  "js/library.js",
  "js/session.js",
  "js/store.js",
  "js/ui/builder.js",
  "js/ui/history.js",
  "js/ui/library.js",
  "js/ui/live.js",
  "js/ui/picker.js",
  "js/ui/profile.js",
  "js/ui/sheet.js",
  "js/ui/start.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new Request(a, { cache: "reload" }))))
      .then(() => caches.keys())
      /* löst diese Version die frühere v2-App ab (keine eigene Version installiert), sofort übernehmen;
         spätere Updates warten auf "Neu laden" */
      .then(keys => { if (!keys.some(k => /^gymplan-v\d/.test(k) && k !== CACHE)) self.skipWaiting(); })
  );
});

self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("gymplan") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      if (req.mode === "navigate") return caches.match("index.html");
      return fetch(req);
    })
  );
});
