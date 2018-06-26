/* global self, caches */
(function () {
  "use strict";

  // Cache name
  const CACHE_NAME = 'restaurant-cache';

  // Doc: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage
  // TODO: This might be constructed dynamically
  const cacheFiles = [
    'img/1.webp', 'img/1_280w.webp', 'img/1_480w.webp',
    'img/2.webp', 'img/2_280w.webp', 'img/2_480w.webp',
    'img/3.webp', 'img/3_280w.webp', 'img/3_480w.webp',
    'img/4.webp', 'img/4_280w.webp', 'img/4_480w.webp',
    'img/5.webp', 'img/5_280w.webp', 'img/5_480w.webp',
    'img/6.webp', 'img/6_280w.webp', 'img/6_480w.webp',
    'img/7.webp', 'img/7_280w.webp', 'img/7_480w.webp',
    'img/8.webp', 'img/8_280w.webp', 'img/8_480w.webp',
    'img/9.webp', 'img/9_280w.webp', 'img/9_480w.webp',
    'img/10.webp', 'img/10_280w.webp', 'img/10_480w.webp',
    'img/undefined.webp', 'img/undefined_280w.webp', 'img/undefined_480w.webp',
    'index.html',
    'restaurant.html',
    'js/dbhelper.js',
    'js/main.min.js',
    'js/idb.min.js',
    'js/restaurant_info.min.js',
    'css/styles.min.css'
  ];

  // Event Listener for service worker install
  self.addEventListener('install', event =>
    event.waitUntil(caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(cacheFiles))
    )
  );

  // Event Listener for new service worker activation, will delete old caches
  self.addEventListener('activate', event =>
    event.waitUntil(caches.keys()
  		.then(cacheNames => Promise.all(
        cacheNames
  				.filter(cacheName => cacheName !== CACHE_NAME)
  				.map(cacheName => caches.delete(cacheName))
  		))
    )
  );

  // Event Listener for fetching data
  self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Prevent Google Maps from bloating the cache!
    if (requestUrl.origin !== location.origin) {
      return;
    }

    // Serve the review pages even if they have not been opened before
    if (requestUrl.pathname.indexOf('/restaurant.html') !== -1) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }

    // Try to serve from cache. Otherwise, fetch and store
    event.respondWith(caches
      .match(event.request)
      .then(response => response || fetchFromNetwork(event.request))
    );

    /**
     * Fetch data from network and store in cache
     *
     * @param {object} request - Request.
     * @return {object} Response for fetch request.
     */
    function fetchFromNetwork (request) {
      return fetch(request)
        .then(response => {
          let responseClone = response.clone();
          caches
            .open(CACHE_NAME)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(error => console.log(`Service worker could not fetch a file. ${error}`));
    }
  });

}());
