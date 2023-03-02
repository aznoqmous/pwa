const CACHE_NAME = "offline"
const OFFLINE_URL = "/"

self.addEventListener("install",  async (e)=>{
    e.waitUntil(registerCache())
    self.skipWaiting()
})
async function registerCache(){
    const cache = await caches.open(CACHE_NAME)
    await cache.add(new Request(OFFLINE_URL, { cache: "reload" }))
}

self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        // Enable navigation preload if it's supported.
        // See https://developers.google.com/web/updates/2017/02/navigation-preload
        if ("navigationPreload" in self.registration) {
          await self.registration.navigationPreload.enable();
        }
      })()
    );
  
    // Tell the active service worker to take control of the page immediately.
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // Only call event.respondWith() if this is a navigation request
    // for an HTML page.
    if (event.request.mode === "navigate") {
      event.respondWith(
        (async () => {
          try {
            // First, try to use the navigation preload response if it's
            // supported.
            const preloadResponse = await event.preloadResponse;
            if (preloadResponse) {
              return preloadResponse;
            }
  
            // Always try the network first.
            const networkResponse = await fetch(event.request);
            return networkResponse;
          } catch (error) {
            // catch is only triggered if an exception is thrown, which is
            // likely due to a network error.
            // If fetch() returns a valid HTTP response with a response code in
            // the 4xx or 5xx range, the catch() will NOT be called.
            console.log("Fetch failed; returning offline page instead.", error);
  
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(OFFLINE_URL);
            return cachedResponse;
          }
        })()
      );
    }
})
  
self.addEventListener('message', (e)=>{
    self.registration.showNotification('PWA', {
        body: "New message from PWA",
        icon: "/sample-144.png",
        silent: false,
        renotify: true,
        vibrate: [200, 100, 200],
    })
})
self.addEventListener('push', (e)=>{
    console.log(e)
    self.registration.showNotification('PWA', {
        body: "New notification from PWA",
        icon: "/sample-144.png",
        vibrate: [200, 100, 200],
    })
})
// self.addEventListener('periodicsync', (e)=>{
//     self.registration.showNotification('periodicsync')
//     e.waitUntil(sync())
// })
async function sync(){
    return new Promise(res => {
        setTimeout(()=>{
            console.log("sync")
            self.registration.showNotification("Synchro effectuée !")
            res()
        }, 1000)
    })
}

