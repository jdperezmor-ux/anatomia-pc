/* TechAnatomy: contenido definitivo 2026-11-16. */
const CACHE = 'techanatomy-final-20261116-v2';
const INDEX = new URL('Anatomia_PC_Offline.html', self.registration.scope).href;
const PATHS = new Set(['', 'index.html', 'Anatomia_PC_Offline.html'].map(p => new URL(p, self.registration.scope).pathname));
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
async function saveCurrent() {
  const response = await fetch(INDEX, {cache: 'no-store'});
  if (!response.ok) throw new Error('No se pudo descargar la versión publicada.');
  const cache = await caches.open(CACHE);
  await cache.put(INDEX, response.clone());
  const names = await caches.keys();
  await Promise.all(names.filter(n => n.startsWith('techanatomy-final-') && n !== CACHE).map(n => caches.delete(n)));
}
self.addEventListener('message', event => {
  if (event.data !== 'PREPARE') return;
  event.waitUntil(saveCurrent().then(() => event.ports[0]?.postMessage({ok:true})).catch(error => event.ports[0]?.postMessage({ok:false,error:error.message})));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !PATHS.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request, {cache:'no-store'});
      if (!response.ok) throw new Error('Respuesta no disponible');
      // Refresh only if this browser previously opted into offline storage.
      if (url.pathname === new URL(INDEX).pathname && await cache.match(INDEX)) {
        try { await cache.put(INDEX, response.clone()); } catch (_) { /* Network response remains usable. */ }
      }
      return response;
    } catch (error) {
      const saved = await cache.match(INDEX);
      if (saved) return saved;
      return new Response('Conéctate a internet y abre TechAnatomy. Después pulsa Preparar sin conexión.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
