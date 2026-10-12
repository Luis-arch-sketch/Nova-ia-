const CACHE='roube-ovo-pwa-v1';const FILES=['/manifest.webmanifest','/capa-roube-um-ovo.jpg','/icone-192.png','/icone-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('roube-ovo-pwa-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==self.location.origin||!FILES.includes(u.pathname))return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
