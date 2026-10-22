// Service Worker – Gym Plan 2.0.1: komplette App offline, Erinnerung im Hintergrund (wo erlaubt)
const CACHE = 'gymplan-2.0.1-1792712742638';
const FILES = ["./","./index.html","./manifest.webmanifest","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./fonts/ClashDisplay-500.woff2","./fonts/ClashDisplay-600.woff2","./fonts/ClashDisplay-700.woff2","./fonts/fonts.css","./fonts/Satoshi-400.woff2","./fonts/Satoshi-500.woff2","./fonts/Satoshi-700.woff2"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Netz zuerst (für Updates, max. 3 s), sonst Offline-Kopie
  e.respondWith(new Promise(resolve => {
    let done = false;
    const fromCache = () => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'));
    const timer = setTimeout(() => { if (!done) { done = true; resolve(fromCache()); } }, 3000);
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      if (!done) { done = true; clearTimeout(timer); resolve(res); }
    }).catch(() => { if (!done) { done = true; clearTimeout(timer); resolve(fromCache()); } });
  }));
});
// Erinnerung: Android prüft installierte Apps gelegentlich im Hintergrund
function readReminder() {
  return new Promise(res => {
    const r = indexedDB.open('gymplan', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => { try { const g = r.result.transaction('kv').objectStore('kv').get('reminder'); g.onsuccess = () => res(g.result || null); g.onerror = () => res(null); } catch (e) { res(null); } };
    r.onerror = () => res(null);
  });
}
const pad = n => String(n).padStart(2, '0');
self.addEventListener('periodicsync', e => {
  if (e.tag !== 'training-reminder') return;
  e.waitUntil(readReminder().then(async st => {
    if (!st || !st.enabled) return;
    const now = new Date(), d = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    const planned = st.extra && st.extra[d] ? true : (!(st.skip && st.skip[d]) && st.weekdays.includes(now.getDay()));
    const [hh, mm] = (st.time || '18:00').split(':').map(Number);
    if (!planned || (st.logs || []).includes(d) || now.getHours() * 60 + now.getMinutes() < hh * 60 + mm || now.getHours() >= 22) return;
    const shown = await self.registration.getNotifications({ tag: 'training-' + d });
    if (shown.length) return;
    return self.registration.showNotification('Heute ist Training', { body: 'Um ' + st.time + ' Uhr geplant – los geht’s!', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'training-' + d });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
