/* global self, caches */
(function () {
  "use strict";

  // Doc: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage

  const cacheFiles = [
    '/',
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
    'index.html',
    'restaurant.html',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'css/styles.css',
    'data/restaurants.json'
  ];

  // Event Listener for service worker install
  self.addEventListener('install', event => {
    event.waitUntil(caches
      .open('restaurant-app-v1')
      .then(cache => cache.addAll(cacheFiles))
      .catch(error => console.error(`Service worker install failed. (${error})`))
    );
  });

  // Event Listener for fetching data
  self.addEventListener('fetch', event => {
    event.respondWith(caches
      /*
       * TODO: Figure out what this feedback is meant to tell me:
       * " This won't hit restaurants.html?id=1. Check out the ignoreSearch
       * option https://developer.mozilla.org/en-US/docs/Web/API/Cache/match"
       * It seems that ignoreSearch is set to false by default, so the
       * complete quere string should be checked for already. Maybe the
       * task required to not cache the restaurant pages?
       */
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
}());
