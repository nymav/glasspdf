import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createHash } from 'node:crypto'

const ocrFiles = new Map([
  ['worker.min.js', 'node_modules/tesseract.js/dist/worker.min.js'],
  ['eng.traineddata.gz', 'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'],
  ['LICENSE-TESSERACT.txt', 'node_modules/tesseract.js/LICENSE.md'],
  ['LICENSE-TESSERACT-CORE.txt', 'node_modules/tesseract.js-core/LICENSE'],
  ['NOTICE.txt', 'THIRD_PARTY_NOTICES.md'],
  ...['lstm', 'simd-lstm', 'relaxedsimd-lstm'].map(variant => [`tesseract-core-${variant}.wasm.js`, `node_modules/tesseract.js-core/tesseract-core-${variant}.wasm.js`]),
])

export default defineConfig(({ mode }) => ({
  define: { 'import.meta.env.APP_VERSION': JSON.stringify(JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version) },
  base: mode === 'desktop' ? '/' : '/glasspdf/',
  plugins: [react(), tailwindcss(), {
    name: 'glasspdf-local-ocr',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const name = new URL(request.url, 'http://localhost').pathname.split('/ocr/')[1]
        const source = ocrFiles.get(name)
        if (!source) return next()
        response.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'application/octet-stream')
        response.end(readFileSync(new URL(source, import.meta.url)))
      })
    },
    generateBundle() {
      for (const [name, path] of ocrFiles) this.emitFile({ type: 'asset', fileName: `ocr/${name}`, source: readFileSync(new URL(path, import.meta.url)) })
    },
  }, {
    name: 'glasspdf-offline',
    apply: 'build',
    generateBundle(_, bundle) {
      if (mode === 'desktop') return
      const assets = Object.keys(bundle).filter(name => !name.startsWith('ocr/'))
      const version = createHash('sha256').update(JSON.stringify(bundle)).digest('hex').slice(0, 12)
      const urls = ['./', './index.html', './favicon.svg', './manifest.webmanifest', './icon-192.png', './icon-512.png', './sample.pdf', ...assets.map(name => './' + name)]
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const CACHE = 'glasspdf-${version}';
const ASSETS = ${JSON.stringify(urls)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('glasspdf-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
  for (const client of await self.clients.matchAll()) client.postMessage({type:'OFFLINE_READY'});
})()));
self.addEventListener('message', event => { if(event.data?.type === 'STATUS') event.source?.postMessage({type:'OFFLINE_READY'}); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if(event.request.mode === 'navigate') {
      return (await cache.match('./index.html')) || fetch(event.request);
    }
    const cached = await cache.match(event.request, { ignoreVary: true });
    if (cached) return cached;
    const response = await fetch(event.request);
    const optionalAssets = ${JSON.stringify(Object.keys(bundle).filter(name => name.startsWith('ocr/')).map(name => './' + name))};
    if (response.ok && optionalAssets.some(name => new URL(name, self.registration.scope).href === url.href)) await cache.put(event.request, response.clone());
    return response;
  })());
});` })
    },
  }],
}))
