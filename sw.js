// Kelime Sınavı: internetsiz çalışma. Sayfayı güncellersen VERSION'ı bir artır.
const VERSION = 'kelime-v27';
const FILES = ['./', './index.html', './data.js', './topics.js', './orig.js', './extra.js', './sound.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const save = (res) => {
    if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
    }
    return res;
  };
  if (req.mode === 'navigate') {
    // Sayfa: önce internet (güncel olsun), yoksa kayıtlı kopya
    e.respondWith(fetch(req).then(save).catch(() => caches.match('./index.html')));
    return;
  }
  // Diğer her şey (simgeler, yazı tipleri): önce kayıtlı kopya
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then(save)));
});
