const CACHE = "studio-v19";
const FILES = ["./", "./index.html", "./manifest.json", "./icon.png"];

/* Immer frisch vom Server laden (HTTP-Cache umgehen), offline aus dem eigenen Cache */
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => fetch(f, { cache: "reload" }).then(r => r.ok && c.put(f, r)).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  const sameOrigin = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(
    fetch(e.request, sameOrigin ? { cache: "no-cache" } : undefined)
      .then(res => {
        if(sameOrigin && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
  );
});
