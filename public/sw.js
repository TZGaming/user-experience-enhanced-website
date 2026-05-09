const CACHE_NAME = 'snapp-images-v1'

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
})

self.addEventListener('fetch', event => {
  if (!event.request.url.includes('fdnd-agency.directus.app/assets/')) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request)
      if (cached) return cached

      const response = await fetch(event.request)
      cache.put(event.request, response.clone())
      return response
    })
  )
})