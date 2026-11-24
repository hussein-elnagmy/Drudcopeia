const CACHE_NAME = 'dawaya-shell-v182';
const APP_SHELL = ['./', './index.html', './styles.css?v=182', './generated/privacy-config.js?v=182', './net.js?v=182', './core.js?v=182', './lab-tests.js?v=182', './clinical-tools.js?v=182', './reading.js?v=182', './news.js?v=182', './news.json', './app.js?v=182', './alt-map.js?v=182', './same-spec.js?v=182', './features.js?v=182', './assets/data/pregnancy-safety.json', './ai/text.js?v=182', './ai/search-index.js?v=182', './ai/safety.js?v=182', './ai/retrieval.js?v=182', './ai/llm-bridge.js?v=182', './ai/wasm-bridge.js?v=182', './ai/model-manager.js?v=182', './ai/pipeline.js?v=182', './ai/secure-history.js?v=182', './ai/photo-ask.js?v=182', './ai/chat-ui.js?v=182', './assets/ai/model-config.json', './assets/ai/policy-config.json', './assets/ai/messages-ar.json', './assets/ai/messages-en.json', './assets/ai/dataset-meta.json', './assets/ai/prompts/system-ar.txt', './assets/ai/prompts/system-en.txt', './assets/ai/prompts/chat-ar.txt', './assets/ai/prompts/chat-en.txt', './assets/ai/prompts/classifier.txt', './manifest.webmanifest', './assets/red-crescent-rx-96.png', './assets/red-crescent-rx-192.png', './assets/red-crescent-rx-512.png', './assets/red-crescent-rx-dark-96.png', './assets/red-crescent-rx-dark-192.png', './assets/barcode-index.json', './assets/lab-tests-content.json', './assets/dawaya-mark.svg', './assets/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
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
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
