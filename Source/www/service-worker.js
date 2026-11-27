const CACHE_NAME = 'dawaya-shell-v204';
const APP_SHELL = ['./', './index.html', './styles.css?v=204', './boot-theme.js?v=204', './sw-register.js?v=204', './generated/privacy-config.js?v=204', './net.js?v=204', './core.js?v=204', './lab-tests.js?v=204', './clinical-tools.js?v=204', './reading.js?v=204', './news.js?v=204', './news.json', './app.js?v=204', './alt-map.js?v=204', './same-spec.js?v=204', './features.js?v=204', './assets/data/pregnancy-safety.json', './ai/text.js?v=204', './ai/search-index.js?v=204', './ai/safety.js?v=204', './ai/retrieval.js?v=204', './ai/llm-bridge.js?v=204', './ai/wasm-bridge.js?v=204', './ai/model-manager.js?v=204', './ai/pipeline.js?v=204', './ai/secure-history.js?v=204', './ai/photo-ask.js?v=204', './ai/chat-ui.js?v=204', './assets/ai/model-config.json', './assets/ai/policy-config.json', './assets/ai/messages-ar.json', './assets/ai/messages-en.json', './assets/ai/dataset-meta.json', './assets/ai/prompts/system-ar.txt', './assets/ai/prompts/system-en.txt', './assets/ai/prompts/chat-ar.txt', './assets/ai/prompts/chat-en.txt', './assets/ai/prompts/classifier.txt', './manifest.webmanifest', './assets/red-crescent-rx-96.png', './assets/red-crescent-rx-192.png', './assets/red-crescent-rx-512.png', './assets/red-crescent-rx-dark-96.png', './assets/red-crescent-rx-dark-192.png','./assets/red-crescent-rx-dark-512.png', './assets/barcode-index.json', './assets/lab-tests-content.json', './assets/conditions.json', './assets/monographs.json', './assets/egyptian-drugs.json?v=204', './assets/dawaya-mark.svg', './assets/apple-touch-icon.png'];

const CORE_SHELL = APP_SHELL.slice(0, 10);
const DATA_FILES = APP_SHELL.slice(10);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Stage 1: the core shell must install atomically — if it fails, the
    // worker must not activate at all.
    await cache.addAll(CORE_SHELL);
    // Stage 2: data files one by one; a single bad file no longer kills the
    // whole install, it is just skipped and re-fetched on demand.
    for (const url of DATA_FILES) {
      try { await cache.add(url); } catch (_) {}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dawaya-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

// Only the app's own static files are cached. A request that carries a query
// string other than the asset revision (a search, a lookup, anything that could
// describe what the reader is doing) is never written to disk.
function isShellAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return url.search === '' || /^\?v=\d+$/.test(url.search);
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (!isShellAsset(url) || event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || caches.match(event.request, { ignoreSearch: true })).then(cached => cached || fetch(event.request).then(response => {
    if (response.status === 200 && response.type === 'basic') {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
