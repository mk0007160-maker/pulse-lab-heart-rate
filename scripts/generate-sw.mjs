import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { createHash } from 'node:crypto'

const dist = new URL('../dist/', import.meta.url).pathname
async function walk(dir) {
  const paths = []
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) paths.push(...await walk(p))
    else if (ent.isFile() && ent.name !== 'sw.js') paths.push(p)
  }
  return paths
}
const files = (await walk(dist)).sort()
const resources = files.map(file => relative(dist, file).replaceAll('\\', '/'))
const h = createHash('sha256')
for (const file of files) { h.update(relative(dist, file)); h.update(await readFile(file)) }
const cacheName = 'pulse-lab-offline-' + h.digest('hex').slice(0, 12)
const body = [
  'const CACHE = ' + JSON.stringify(cacheName) + ';',
  'const FILES = ' + JSON.stringify(resources) + ';',
  'const BASE = self.registration.scope;',
  "self.addEventListener('install', event => {",
  '  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(name => new URL(name, BASE).toString()))).then(() => self.skipWaiting()));',
  '});',
  "self.addEventListener('activate', event => {",
  "  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pulse-lab-offline-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));",
  '});',
  "self.addEventListener('fetch', event => {",
  "  if (event.request.method !== 'GET') return;",
  '  const url = new URL(event.request.url);',
  '  if (url.origin !== self.location.origin || !url.href.startsWith(BASE)) return;',
  '  event.respondWith(caches.match(event.request).then(cached => {',
  '    if (cached) return cached;',
  "    if (event.request.mode === 'navigate') return fetch(event.request).catch(() => caches.match(new URL('index.html', BASE)));",
  '    return fetch(event.request);',
  '  }));',
  '});'
].join('\n') + '\n'
await writeFile(join(dist, 'sw.js'), body)
console.log('Generated offline service worker caching ' + resources.length + ' files')
