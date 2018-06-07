/* global self, caches */
(function () {
  "use strict";

  // Doc: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage

  const cacheFiles = [
    '/',
    'img/1.jpg', 'img/1_280w.jpg', 'img/1_480w.jpg',
    'img/2.jpg', 'img/2_280w.jpg', 'img/2_480w.jpg',
    'img/3.jpg', 'img/3_280w.jpg', 'img/3_480w.jpg',
    'img/4.jpg', 'img/4_280w.jpg', 'img/4_480w.jpg',
    'img/5.jpg', 'img/5_280w.jpg', 'img/5_480w.jpg',
    'img/6.jpg', 'img/6_280w.jpg', 'img/6_480w.jpg',
    'img/7.jpg', 'img/7_280w.jpg', 'img/7_480w.jpg',
    'img/8.jpg', 'img/8_280w.jpg', 'img/8_480w.jpg',
    'img/9.jpg', 'img/9_280w.jpg', 'img/9_480w.jpg',
    'img/10.jpg', 'img/10_280w.jpg', 'img/10_480w.jpg',
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
