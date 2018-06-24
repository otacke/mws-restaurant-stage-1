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
  static get DATABASE_NAME_RESTAURANTS () {
    return 'restaurants-db';
  }

  /**
   * Open IndexedDB.
   *
   * @param {string} dbName - Database type.
   * @return {Promise} Promise for idb.
   */
  static databaseOpen () {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    // Create database if not created yet
    return idb.open(DBHelper.DATABASE_NAME_RESTAURANTS, 1, upgradeDb => {
      upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
      upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
      upgradeDb.createObjectStore('reviews_pending', {keyPath: 'id', autoIncrement: true});
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
      .databaseOpen()
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
   * @return {object} Restaurant data.
   */
  static databaseGet (dbTable) {
    return DBHelper
      .databaseOpen()
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
    });
  }

  /**
   * Fetch all restaurants.
   *
   * @param {function} callback - Callback function.
   */
  static fetchRestaurants (callback) {
    return DBHelper
      .databaseGet('restaurants')
      .then(restaurants => (restaurants.length) ?
        Promise.resolve(restaurants) :
        DBHelper.databaseSet(DBHelper.DATABASE_URL_RESTAURANTS, 'restaurants')
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
      .databaseGet('reviews')
      .then(reviews => (reviews.length) ?
        Promise.resolve(reviews) :
        DBHelper.databaseSet(DBHelper.DATABASE_URL_REVIEWS, 'reviews')
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
    return fetch(DBHelper.DATABASE_URL_REVIEWS, {method: 'post', body: review})
      .then(function (response) {
        if (response.ok) {
          return response.json();
        } else {
          return [{}];
        }
      });
  }

}
