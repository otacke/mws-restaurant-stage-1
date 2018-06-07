(function () {
  "use strict";

// Register service worker
if (navigator.serviceWorker) {
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then(() => console.log('Service worker has been registered.'));
}
}());
