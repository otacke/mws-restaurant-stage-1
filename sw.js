/* global self, caches */

// Doc: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage

// Event Listener for service worker install
self.addEventListener('install', event => {
  "use strict";
  event.waitUntil(caches
    .open('restaurant-app-v1')
    .then(cache => cache.addAll([
      '/', 'img/1_thumb.jpg', 'img/2_thumb.jpg', 'img/3_thumb.jpg',
      'img/4_thumb.jpg', 'img/5_thumb.jpg', 'img/6_thumb.jpg',
      'img/7_thumb.jpg', 'img/8_thumb.jpg', 'img/9_thumb.jpg',
      'img/10_thumb.jpg', 'img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/4.jpg',
      'img/5.jpg', 'img/6.jpg', 'img/7.jpg', 'img/8.jpg', 'img/9.jpg',
      'img/10.jpg', 'restaurant.html', 'index.html', 'js/main.js',
      'js/dbhelper.js', 'js/restaurant_info.js', 'css/styles.css',
      'data/restaurants.json'
    ]))
    .catch(error => console.error(`Service worker install failed. (${error})`))
  );
});

// Event Listener for fetching data
self.addEventListener('fetch', event => {
  "use strict";
  event.respondWith(caches
    .match(event.request)
    .then(response => response || fetch(event.request)
      .then(result => {
        caches
          .open('v1')
          .then(cache => cache.put(event.request, result));
        return result.clone();
      })
    )
    // Could also return the path to a default image
    .catch(() => console.warn('No match found in cache.'))
  );
});
