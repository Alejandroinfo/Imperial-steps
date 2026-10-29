'use strict';
// Service worker mínimo: deja el juego instalable y usable sin conexión contra bots.
// Estrategia «red primero»: si hay internet siempre se descarga lo último (así las partidas en línea usan todos la misma versión);
// si no hay, se usa la copia guardada. Lo de otros dominios (Firebase) no se toca.
const VERSION = 'pasos-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(VERSION).then(c => c.addAll(['./', './index.html', './manifest.json', './icons/icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res && res.ok) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(r, copia)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
});
