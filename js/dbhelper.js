/* global google, idb */

/**
 * Common database helper functions.
 *
 * Uses idb.
 * @see https://github.com/jakearchibald/idb
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL () {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  // Database name.
  static get DATABASE_NAME () {
    return 'restaurants-db';
  }

  /**
   * Open IndexedDB.
   *
   * @return {Promise} Promise for idb.
   */
  static databaseOpen () {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    // Create database if not created yet
    return idb.open(DBHelper.DATABASE_NAME, 1, upgradeDb => {
      upgradeDb.createObjectStore(DBHelper.DATABASE_NAME, {keyPath: 'id'});
    });
  }

  /**
   * Insert data into IndexedDB.
   *
   * @param {object} data - Data to be inserted.
   * @return {object} IDBTransaction object.
   */
  static databaseInsert (data) {
    return DBHelper
      .databaseOpen()
      .then(db => {
        // Exit if no database present
        if (!db) {
          return;
        }

        // Insert data
        const tx = db.transaction(DBHelper.DATABASE_NAME, 'readwrite');
        const store = tx.objectStore(DBHelper.DATABASE_NAME);
        data.forEach(restaurant => store.put(restaurant));

        return tx.complete;
      })
      .catch(error => console.error(`Could not write to db (${error}).`));
  }

  /**
   * Set restaurants in idb.
   *
   * @return {Promise} Promise to set restaurants.
   */
  static databaseSetRestaurants () {
    return fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(restaurants => {
        DBHelper.databaseInsert(restaurants);
        return restaurants;
      });
  }

  /**
   * Get restaurants from idb.
   *
   * @return {object} Restaurant data.
   */
  static databaseGetRestaurants () {
    return DBHelper
      .databaseOpen()
      .then(db => {
        // Exit if db cannot be opened
        if (!db) {
          return;
        }

        // Get data
        const store = db
          .transaction(DBHelper.DATABASE_NAME)
          .objectStore(DBHelper.DATABASE_NAME);
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
      .databaseGetRestaurants()
      .then(restaurants => (restaurants.length) ?
        Promise.resolve(restaurants) :
        DBHelper.databaseSetRestaurants()
      )
      .then(restaurants => {
        callback(null, restaurants);
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

}
