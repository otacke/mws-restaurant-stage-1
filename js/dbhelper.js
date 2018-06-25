/* global google, idb */

/**
 * Common database helper functions.
 *
 * Uses idb.
 * @see https://github.com/jakearchibald/idb
 */
class DBHelper {

  /**
   * Database port.
   */
  static get PORT () {
    return 1337;
  }

  /**
   * Database host.
   */
  static get HOST () {
    return `http://localhost:${DBHelper.PORT}`;
  }

  /**
   * Database URL for restaurants.
   */
  static get DATABASE_URL_RESTAURANTS () {
    return `${DBHelper.HOST}/restaurants`;
  }

  /**
   * Database URL for reviews.
   */
  static get DATABASE_URL_REVIEWS () {
    return `${DBHelper.HOST}/reviews`;
  }

  // Database name for restaurants.
  static get DBID_RESTAURANTS () {
    return 'restaurants';
  }

  // Database name for reviews.
  static get DBID_REVIEWS () {
    return 'reviews';
  }

  // Database name for reviews.
  static get DBID_QUEUE () {
    return 'restaurant-queue';
  }

  /**
   * Add listeners.
   * Not the best place in DBHelper ;-) Gotta clean up here anyway ...
   */
  static initListeners () {
    // Add toast
    const toast = document.createElement('div');
    toast.setAttribute('id', 'toast');
    toast.classList.add('toast');
    toast.innerHTML = 'You\'re offline. If you post any reviews, they will be sent as soon as you are online again.';
    if (!navigator.onLine) {
      toast.classList.add('visible');
      setTimeout(() => {
        toast.classList.remove('visible')
      }, 3000);
    }
    document.body.appendChild(toast);

    // If going online, empty the queue
    window.addEventListener('online', () => {
      if (!navigator.serviceWorker) {
        return;
      }
      DBHelper.flushObjects(DBHelper.DBID_QUEUE);
      // Database should be refreshed in case we missed something
      DBHelper
        .databaseRefetch(DBHelper.DBID_REVIEWS)
        .then(() => {
          location.reload();
        });
    });

    // If going offline, show toast
    window.addEventListener('offline', () => {
      if (!navigator.serviceWorker) {
        return;
      }
      const toast = document.getElementById('toast')
      toast.classList.add('visible');
      setTimeout(() => {
        toast.classList.remove('visible')
      }, 3000);
    });
  }

  /**
   * Open IndexedDB.
   *
   * @param {string} [dbid] - Database ID.
   * @return {Promise} Promise for idb.
   */
  static databaseOpen (table = DBHelper.DBID_RESTAURANTS) {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open(table, 1, upgradeDb => {
      upgradeDb.createObjectStore(table, {keyPath: 'id', autoIncrement: true});
    });
  }

  /**
   * Insert data into IndexedDB.
   *
   * @param {object} data - Data to be inserted.
   * @param {string} dbTable - Database name.
   * @return {object} IDBTransaction object.
   */
  static databaseInsert (data, dbTable) {
    return DBHelper
      .databaseOpen(dbTable)
      .then(db => {
        // Exit if no database present
        if (!db) {
          return;
        }

        // Insert data
        const tx = db.transaction(dbTable, 'readwrite');
        const store = tx.objectStore(dbTable);
        data.forEach(item => store.put(item));

        return tx.complete;
      })
      .catch(error => console.error(`Could not write to db (${error}).`));
  }

  static databaseClear (dbTable) {
    return DBHelper
      .databaseOpen(dbTable)
      .then(db => {
        // Exit if no database present
        if (!db) {
          return;
        }
        const tx = db.transaction(dbTable, 'readwrite');
        const store = tx.objectStore(dbTable);
        store.clear();
        return tx.complete;
      })
      .catch(error => console.error(`Could not clean db (${error}).`));
  }

  /**
   * Refetch data from network.
   *
   * @param {string} dbTable - Database table.
   */
  static databaseRefetch (dbTable) {
    return DBHelper
      // Delete old data
      .databaseClear(dbTable)
      // get fresh data
      .then(() => {
        switch (dbTable) {
          case DBHelper.DBID_REVIEWS:
            DBHelper
              .fetchReviews(() => {})
              .then(() => true);
            break;
          case DBHelper.DBID_RESTAURANTS:
            DBHelper
            .fetchRestaurants(() => {})
            .then(() => true);
            break;
        }
      });
  }

  /**
   * Set restaurants in idb.
   *
   * @param {string} dbURL - Database name.
   * @param {string} dbTable - Database table.
   * @return {Promise} Promise to set restaurants.
   */
  static databaseSet (dbURL, dbTable) {
    return fetch(dbURL)
      .then(response => response.json())
      .then(items => {
        DBHelper.databaseInsert(items, dbTable);
        return items;
      });
  }

  /**
   * Get data from idb.
   *
   * @param {string} dbTable - Database table.
   * @return {object} Data.
   */
  static databaseGet (dbTable) {
    return DBHelper
      .databaseOpen(dbTable)
      .then(db => {
        // Exit if db cannot be opened
        if (!db) {
          return;
        }

        // Get data
        const store = db
          .transaction(dbTable)
          .objectStore(dbTable);
        return store.getAll();
      }).then(data => {
        return data;
      });
  }

  /**
   * Fetch all restaurants.
   *
   * @param {function} callback - Callback function.
   */
  static fetchRestaurants (callback) {
    return DBHelper
      .databaseGet(DBHelper.DBID_RESTAURANTS)
      .then(restaurants => (restaurants.length) ?
        Promise.resolve(restaurants) :
        DBHelper.databaseSet(DBHelper.DATABASE_URL_RESTAURANTS, DBHelper.DBID_RESTAURANTS)
      )
      .then(restaurants => {
        callback(null, restaurants);
      })
      .catch(error => {
        callback(error, null);
      });
  }

  /**
   * Fetch all reviews.
   *
   * @param {function} callback - Callback function.
   */
  static fetchReviews (callback) {
    return DBHelper
      .databaseGet(DBHelper.DBID_REVIEWS)
      .then(reviews => (reviews.length) ?
        Promise.resolve(reviews) :
        DBHelper.databaseSet(DBHelper.DATABASE_URL_REVIEWS, DBHelper.DBID_REVIEWS)
      )
      .then(reviews => {
        callback(null, reviews);
      })
      .catch(error => {
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   *
   * @param {number} id - Restaurant ID.
   * @param {function} callback - Callback function.
   */
  static fetchRestaurantById (id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id === parseInt(id));
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch a review by its ID.
   *
   * @param {number} id - Review ID.
   * @param {function} callback - Callback function.
   */
  static fetchReviewById (id, callback) {
    // fetch all reviews with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews.find(r => r.id === parseInt(id));
        if (review) { // Got the review
          callback(null, review);
        } else { // Review does not exist in the database
          callback('Review does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch reviews by a restaurant with proper error handling.
   *
   * @param {number} restaurantId - Restaurant ID.
   * @param {function} callback - Callback function.
   */
  static fetchReviewsByRestaurant (restaurantId, callback) {
    // Fetch all reviews with proper error handling
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter reviews to have only given restaurantId
        const results = reviews.filter(r => r.restaurant_id === parseInt(restaurantId));
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   *
   * @param {string} cuisine - Restaurant type.
   * @param {function} callback - Callback function.
   */
  static fetchRestaurantByCuisine (cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type === cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   *
   * @param {string} neighborhood - Restaurant location.
   * @param {function} callback - Callback function.
   */
  static fetchRestaurantByNeighborhood (neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood === neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   *
   * @param {string} cuisine - Restaurant type.
   * @param {string} neighborhood - Restaurant location.
   * @param {function} callback - Callback function.
   */
  static fetchRestaurantByCuisineAndNeighborhood (cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type === cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood === neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   *
   * @param {function} callback - Callback function.
   */
  static fetchNeighborhoods (callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   *
   * @param {function} callback - Callback function.
   */
  static fetchCuisines (callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   *
   * @param {number} id - Restaurant ID.
   * @return {object} Restaurant URL.
   */
  static urlForRestaurant (restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   *
   * @param {string} restaurant - Restaurant photo name.
   * @return {object} Restaurant photo URL.
   */
  static imageUrlForRestaurant (restaurant) {
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   *
   * @param {string} restaurant - Restaurant URL.
   * @param {object} map - GoogleMap.
   * @return {object} Marker for GoogleMap.
   */
  static mapMarkerForRestaurant (restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  /**
   * Post review.
   *
   * @param {object} review - Review.
   * @return {object} Response, will be completed review data or empty.
   */
  static postReview (review) {
    // Add item to idb
    DBHelper.databaseInsert ([review], DBHelper.DBID_REVIEWS);

    // Push object to queue
    DBHelper.pushObject(DBHelper.DBID_QUEUE, review);

    // Empty queue if online, will be triggered as soon as online later, too.
    if (navigator.onLine) {
      DBHelper.flushObjects(DBHelper.DBID_QUEUE);
    }
    return Promise.resolve(review);
  }

  /**
   * Push object to Storage queue.
   *
   * @param {string} key - Storage key.
   * @param {object} value - Object.
   */
  static pushObject (key, value) {
    const storageValue = DBHelper.retrieveObject(key);
    if (storageValue === null) {
      localStorage.setItem(key, JSON.stringify([value]));
    }
    else {
      storageValue.push(value);
      localStorage.setItem(key, JSON.stringify(storageValue));
    }
  }

  /**
   * Retrieve object from Storage queue.
   *
   * @param {string} key - Storage key.
   */
  static retrieveObject (key) {
    const value = localStorage.getItem(key);
    return value && JSON.parse(value);
  }

  /**
   * Shift Storage queue.
   *
   * @param {string} key - Storage key.
   */
  static shiftObject (key) {
    const storageValue = DBHelper.retrieveObject(key);
    if (storageValue !== null) {
      storageValue.shift();
      localStorage.setItem(key, JSON.stringify(storageValue));
    }
  }

  /**
   * Post as many items from the queue as possible.
   *
   * Will post all items from the queue (LIFO) to the server and empty
   * the queue. If an item cannot be sent, assume that the network is gone
   * and stop posting.
   *
   * @param {string} key - Storage key.
   */
  static flushObjects (key) {
    const storageValue = DBHelper.retrieveObject(key);
    if (storageValue === null) {
      return;
    }

    // Post as many items from queue as possible
    storageValue.some(item => {
      fetch(
        DBHelper.DATABASE_URL_REVIEWS,
        {
          method: 'post',
          body: JSON.stringify(item),
          headers: new Headers({'Content-Type': 'application/json'})
        })
        .then(response => {
          if (response.ok) {
            // Remove sent item from DB
            DBHelper.shiftObject(DBHelper.DBID_QUEUE);
          }
          else {
            // Maybe network is gone again. Break.
            return true;
          }
        });
    });
  }

}

DBHelper.initListeners();
