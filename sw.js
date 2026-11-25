// Word Deck: internetsiz çalışma. Sayfayı güncellersen VERSION'ı bir artır.
const VERSION = 'kelime-v43';
const FILES = ['./', './index.html', './data.js', './topics.js', './orig.js', './extra.js', './stories.js', './sound.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  // Tarayıcının kendi ara belleğini atla, sunucudaki en yeni dosyaları al
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// Uygulamanın kendi dosyaları: önce internet (her zaman güncel), internet yoksa ya da çok yavaşsa kayıtlı kopya.
function fetchFresh(u) { return new Request(u, { cache: 'no-cache', credentials: 'same-origin' }); }
function netFirst(req, key, fallback) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (r) => { if (!done && r) { done = true; resolve(r); } };
    const fromCache = () => caches.match(key, { ignoreSearch: true }).then((r) => r || (fallback ? caches.match(fallback) : null));
    const t = setTimeout(() => fromCache().then(finish), 4000);
    fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone(), path = new URL(key.url).pathname;
        caches.open(VERSION).then((c) => c.keys().then((ks) => Promise.all(ks.filter((k) => new URL(k.url).pathname === path && k.url !== key.url).map((k) => c.delete(k)))).then(() => c.put(key, copy)));
      }
      clearTimeout(t); finish(res);
    }).catch(() => fromCache().then((r) => { clearTimeout(t); finish(r || Response.error()); }));
  });
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(netFirst(fetchFresh(req.url), req, './index.html'));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(netFirst(new Request(req, { cache: 'no-cache' }), req));
    return;
  }
  // Dış kaynaklar (yazı tipleri): önce kayıtlı kopya
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  })));
});
