
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('#food-places');
  if (!section) return;

  const centerAttr = section.getAttribute('data-center');
  if (!centerAttr) return;
  const [lat, lng] = centerAttr.split(',').map(Number);
  const centerloca = { lat, lng };

  // Initialize map with dynamic center
  const map1 = L.map('foodmap').setView([lat, lng], 13);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map1);

  // Add main location marker
  L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })
  }).addTo(map1)
    .bindPopup('Food and Dine At This Location')
    .openPopup();

  // Add circle to show search radius
  L.circle([lat, lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.2,
    radius: 4000
  }).addTo(map1);

  // Add routing from BW Stays to location
  L.Routing.control({
    waypoints: [
      L.latLng(11.605943, 76.083429), 
      L.latLng(lat, lng)
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    createMarker: function() { return null; },
    lineOptions: {
      styles: [{ color: '#4285F4', weight: 5, opacity: 0.6 }]
    }
  }).addTo(map1);

  const foodPlacesContainer = document.getElementById('food-list');

  // Overpass API query
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:4000,${lat},${lng});
      node["amenity"="cafe"](around:4000,${lat},${lng});
      node["amenity"="fast_food"](around:4000,${lat},${lng});
    );
    out center meta;
  `;

  // Fetch restaurants from Overpass API
  fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  })
  .then(response => response.json())
  .then(data => {
    if (data.elements && data.elements.length > 0) {
      // Filter and sort restaurants
      const restaurants = data.elements
        .filter(el => el.lat && el.lon && el.tags && el.tags.name)
        .slice(0, 5); // Limit to top 5 like Google Maps version

      restaurants.forEach(restaurant => {
        const cuisineType = guessCuisineFromTags(restaurant.tags);

        // Add marker to map
        L.marker([restaurant.lat, restaurant.lon], {
          icon: L.icon({
            iconUrl: 'https://www.bwstays.com/assets/img/logo/pin.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(map1)
          .bindPopup(restaurant.tags.name);

        // Add to restaurant list
        let placeHTML = `
          <div class="mb-4 text-right">
            <h6 class="text-white">${restaurant.tags.name}</h6>
            <a href="https://www.google.com/maps?saddr=${lat},${lng}&daddr=${restaurant.lat},${restaurant.lon}"
               alt="location map" target="_blank" rel="noopener noreferrer nofollow">
              <p class="text-white-50 small mb-1">
                <i class="fas fa-map-marker-alt text-primary mr-2"></i>
                ${restaurant.tags.addr || 'Unknown location'}
              </p>
            </a>
            <p class="text-white-50 small mb-1">
              <i class="fas fa-utensils text-primary mr-2"></i>
              ${cuisineType}
            </p>
          </div>
        `;
        foodPlacesContainer.insertAdjacentHTML('beforeend', placeHTML);
      });
    }
  })
  .catch(err => {
    console.error("Error fetching restaurants:", err);
    foodPlacesContainer.innerHTML = '<p class="text-white-50">Unable to load restaurants.</p>';
  });

});

function guessCuisineFromTags(tags) {
  if (tags.cuisine) return tags.cuisine.charAt(0).toUpperCase() + tags.cuisine.slice(1);
  if (tags.amenity === 'pub') return 'Pub';
  if (tags.amenity === 'food_court') return 'Food Court';
  if (tags.amenity === 'bar') return 'Bar';
  if (tags.amenity === 'cafe') return 'Cafe';
  if (tags.amenity === 'fast_food') return 'Fast Food';
  if (tags.amenity === 'restaurant') return 'Restaurant';
  return 'Multi-Cuisine';
}