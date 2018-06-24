/* globals DBHelper, google, self */

let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
    DBHelper.fetchReviewsByRestaurant(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
      }
      fillOwnReviewHTML(parseInt(id));
      fillReviewsHTML();
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const source = DBHelper.imageUrlForRestaurant(restaurant);
  const source280 = source.replace('.webp', '_280w.webp');
  const source480 = source.replace('.webp', '_480w.webp');

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = source;
  image.srcset = `${source280} 280w, ${source480} 480w, ${source} 800w`;
  image.sizes = '(max-width: 450px) 280px, (max-width: 600px) 480px, 800px';
  image.alt = "An image of restaurant" + restaurant.name + " in " + restaurant.neighborhood;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('div');
    row.setAttribute('role', 'listitem');
    row.setAttribute('tabindex', 0);
    row.classList.add('restaurant-hours-row');

    const day = document.createElement('div');
    day.classList.add('restaurant-hours-day');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('div');
    time.classList.add('restaurant-hours-time');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

fillOwnReviewHTML = (restaurantId) => {
  const container = document.getElementById('review-own');
  const title = document.createElement('h3');
  title.innerHTML = 'Your Review';
  title.id = 'own-review-title';
  container.appendChild(title);

  this.form = document.createElement('form');
  this.form.setAttribute('action', DBHelper.DATABASE_URL_REVIEWS);
  this.form.setAttribute('method', 'POST');
  this.form.classList.add('reviews-form');

  const formRestaurantId = document.createElement('input');
  formRestaurantId.setAttribute('id', 'restaurant-id');
  formRestaurantId.setAttribute('name', 'restaurant_id');
  formRestaurantId.setAttribute('type', 'hidden');
  formRestaurantId.setAttribute('value', restaurantId);
  this.form.appendChild(formRestaurantId);

  const timestamp = new Date().getTime();
  const formCreatedAt = document.createElement('input');
  formCreatedAt.setAttribute('id', 'created-at');
  formCreatedAt.setAttribute('name', 'createdAt');
  formCreatedAt.setAttribute('type', 'hidden');
  formCreatedAt.setAttribute('value', timestamp);
  this.form.appendChild(formCreatedAt);

  const formUpdatedAt = document.createElement('input');
  formUpdatedAt.setAttribute('id', 'updated-at');
  formUpdatedAt.setAttribute('name', 'updatedAt');
  formUpdatedAt.setAttribute('type', 'hidden');
  formUpdatedAt.setAttribute('value', timestamp);
  this.form.appendChild(formUpdatedAt);

  const formNameContainer = document.createElement('div');
  formNameContainer.classList.add('review-form-field');

  const formNameLabel = document.createElement('label');
  formNameLabel.classList.add('review-form-label');
  formNameLabel.setAttribute('for', 'name');
  formNameLabel.innerHTML = 'Name';
  formNameContainer.appendChild(formNameLabel);

  const formName = document.createElement('input');
  formName.classList.add('review-form-item');
  formName.setAttribute('id', 'name');
  formName.setAttribute('name', 'name');
  formName.setAttribute('placeholder', 'Your name');
  formName.setAttribute('type', 'text');
  formName.setAttribute('required', 'required');
  formNameContainer.appendChild(formName);

  const formRatingContainer = document.createElement('div');
  formRatingContainer.classList.add('review-form-field');

  const formRatingLabel = document.createElement('label');
  formRatingLabel.classList.add('review-form-label');
  formRatingLabel.setAttribute('for', 'name');
  formRatingLabel.innerHTML = 'Rating';
  formRatingContainer.appendChild(formRatingLabel);

  const formRating = document.createElement('select');
  formRating.classList.add('review-form-item');
  formRating.setAttribute('id', 'rating');
  formRating.setAttribute('name', 'rating');
  for (let i = 1; i <= 5; i++) {
    const option = document.createElement('option');
    option.setAttribute('value', i);
    option.innerHTML = i;
    if (i === 3) {
      option.setAttribute('selected', 'selected');
    }
    formRating.appendChild(option);
  }
  formRating.setAttribute('type', 'number');
  formRating.setAttribute('required', 'required');
  formRatingContainer.appendChild(formRating);

  const formCommentsContainer = document.createElement('div');
  formCommentsContainer.classList.add('review-form-field');

  const formCommentsLabel = document.createElement('label');
  formCommentsLabel.classList.add('review-form-label');
  formCommentsLabel.setAttribute('for', 'name');
  formCommentsLabel.innerHTML = 'Comments';
  formCommentsContainer.appendChild(formCommentsLabel);

  const formComments = document.createElement('textarea');
  formComments.classList.add('review-form-item');
  formComments.setAttribute('id', 'comments');
  formComments.setAttribute('name', 'comments');
  formComments.setAttribute('placeholder', 'Please write your review here ...');
  formComments.setAttribute('rows', 4);
  formComments.setAttribute('required', 'required');
  formCommentsContainer.appendChild(formComments);

  const formSubmit = document.createElement('input');
  formSubmit.setAttribute('type', 'submit');
  formSubmit.innerHTML = 'Submit Review';

  this.form.appendChild(formNameContainer);
  this.form.appendChild(formRatingContainer);
  this.form.appendChild(formCommentsContainer);
  this.form.appendChild(formSubmit);

  container.appendChild(this.form);

  this.form.addEventListener('submit', event => {
    // Ignore default submit action
    event.preventDefault();

    // Compose review
    const review = {
      restaurant_id: parseInt(this.form.querySelector('#restaurant-id').value),
      name: strip(this.form.querySelector('#name').value),
      createdAt: parseInt(this.form.querySelector('#created-at').value),
      updatedAt: parseInt(this.form.querySelector('#updated-at').value),
      rating: parseInt(this.form.querySelector('#rating').value),
      comments: strip(this.form.querySelector('#comments').value),
    };

    if (true) {
      DBHelper
        .postReview(JSON.stringify(review))
        .then(result => {
          this.reviews.push(result);
          fillReviewsHTML();
        })
        .catch(error => {
          console.error('Could not post review', error);
        });
    }

    this.form.reset();

  });
};

/**
 * Strip HTML from user input
 *
 * @param {string} input - User input.
 * @returns {string} Stipped user input.
 */
strip = (input) => {
  return new DOMParser().parseFromString(input, 'text/html').body.textContent || '';
};



/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = this.reviews) => {
  const container = document.getElementById('reviews-container');
  const ul = document.getElementById('reviews-list');

  // Clean old content
  ul.innerHTML = '';

  const title = document.createElement('h3');
  title.innerHTML = 'Other Reviews';
  title.id = 'review-title';
  ul.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('div');
  li.setAttribute('role', 'listitem');
  li.setAttribute('tabindex', 0);
  li.classList.add('reviews-item');

  const reviewHeader = document.createElement('div');
  reviewHeader.classList.add('review-header');
  li.appendChild(reviewHeader);

  const name = document.createElement('p');
  name.classList.add('review-name');
  name.innerHTML = review.name;
  reviewHeader.appendChild(name);

  const date = document.createElement('p');
  date.classList.add('review-date');
  const currentDate = new Date(review.updatedAt || review.createdAt || undefined);
  date.innerHTML = currentDate.toLocaleDateString();
  reviewHeader.appendChild(date);

  const rating = document.createElement('p');
  rating.classList.add('review-rating');
  rating.innerHTML = `Rating: ${review.rating}`;
  reviewHeader.appendChild(rating);

  const comments = document.createElement('p');
  comments.classList.add('review-comments');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

// Register service worker
if (navigator.serviceWorker) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => console.log('Service worker has been registered.'))
    .catch(error => console.log(`Could not register service worker (${error}).`));
}
