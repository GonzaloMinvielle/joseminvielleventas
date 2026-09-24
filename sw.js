"use strict";
/* Service worker: deja abrir la app sin conexión.
   - Archivos propios (index, app.js, db.js...): primero la red, si no hay conexión la copia guardada.
     Así cada deploy de Netlify se ve apenas se abre la app con internet.
   - Librerías de CDN con versión fija y Google Fonts: primero la copia guardada (no cambian).
   - Supabase: los datos, el login y el tiempo real NUNCA se guardan acá (de eso se ocupa db.js).
     Solo las fotos públicas de productos, para que los catálogos en PDF salgan sin conexión.
   Subir VERSION cuando cambie la lista de archivos o las librerías de CDN. */
const VERSION = "v1";
const SHELL = "libreta-shell-" + VERSION;
const CDN = "libreta-cdn-" + VERSION;
const FOTOS = "libreta-fotos-" + VERSION;

const SHELL_FILES = ["./", "index.html", "app.js", "db.js", "config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];
const CDN_FILES = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/dist/umd/supabase.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];
const FONTS_CSS = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap";
const CDN_HOSTS = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    await (await caches.open(SHELL)).addAll(SHELL_FILES.map(u => new Request(u, {cache: "reload"})));
    const cdn = await caches.open(CDN);
    await cdn.addAll(CDN_FILES);
    // Las fuentes son opcionales (sin ellas se usa la del sistema): si fallan, no se frena la instalación
    try {
      const css = await fetch(FONTS_CSS);
      if (css.ok) {
        const urls = [...(await css.clone().text()).matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]);
        await cdn.put(FONTS_CSS, css);
        await cdn.addAll(urls);
      }
    } catch(e) {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keep = [SHELL, CDN, FOTOS];
    for (const k of await caches.keys()) if (k.startsWith("libreta-") && !keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") return;

  if (url.origin === self.location.origin) { e.respondWith(networkFirst(req)); return; }
  if (CDN_HOSTS.includes(url.hostname)) { e.respondWith(cacheFirst(req)); return; }
  if (url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/v1/object/public/fotos/")) {
    e.respondWith(staleWhileRevalidate(req, e)); return;
  }
  // Todo lo demás (API de Supabase, login, etc.) va directo a la red, sin pasar por la caché.
});

async function networkFirst(req){
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === "basic") cache.put(req, res.clone());
    return res;
  } catch(err) {
    const hit = await cache.match(req, {ignoreSearch: true}) ||
      (req.mode === "navigate" ? await cache.match("./") || await cache.match("index.html") : null);
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req){
  const cache = await caches.open(CDN);
  const hit = await cache.match(req, {ignoreVary: true});
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, e){
  const cache = await caches.open(FOTOS);
  const hit = await cache.match(req, {ignoreVary: true});
  const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net;
}
