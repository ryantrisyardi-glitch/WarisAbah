/* Service worker · Waris Keluarga
   Ubah VERSION setiap kali Anda mengganti file ikon/manifest agar cache lama dibersihkan. */
const VERSION = "waris-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const CDN = u => (u.hostname === "www.gstatic.com" && u.pathname.startsWith("/firebasejs/")) || u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";

self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url);
  // Halaman: ambil versi terbaru dari jaringan, cadangan dari cache saat offline
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put("./index.html", cp)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Aset statis & SDK Firebase: tampilkan cache dulu, perbarui di latar belakang
  if (u.origin === location.origin || CDN(u)) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
  // Firestore, Auth, Cloudinary: tidak disentuh (selalu langsung ke jaringan)
});
