document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('#food-places');
  if (!section) return;
  const centerAttr = section.getAttribute('data-center');
  if (!centerAttr) return;
  const [lat, lng] = centerAttr.split(',').map(Number);
  const centerloca = { lat, lng };
  const map1 = L.map('foodmap').setView([lat, lng], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).on('tileload', function(e) {
    e.tile.alt = 'Food joins at wayand'; 
}).addTo(map1);
  L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })
  }).on('tileload', function(e) {
    e.tile.alt = 'All Locations at wayand'; 
}).addTo(map1)
    .bindPopup('Food and Dine')
    .openPopup();
  L.circle([lat, lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.2,
    radius: 4000
  }).on('tileload', function(e) {
    e.tile.alt = 'All Locations at wayand'; 
}).addTo(map1);
  const foodPlacesContainer = document.getElementById('food-list');
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:4000,${lat},${lng});
      node["amenity"="cafe"](around:4000,${lat},${lng});
      node["amenity"="fast_food"](around:4000,${lat},${lng});
    );
    out center meta;
  `;
  fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  })
  .then(response => response.json())
  .then(data => {
    if (data.elements && data.elements.length > 0) {
      const restaurants = data.elements
        .filter(el => el.lat && el.lon && el.tags && el.tags.name)
        .slice(0, 5); 
      restaurants.forEach(restaurant => {
        const cuisineType = guessCuisineFromTags(restaurant.tags);
        L.marker([restaurant.lat, restaurant.lon], {
          icon: L.icon({
            iconUrl: 'https://www.bwstays.com/assets/img/logo/pin.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).on('tileload', function(e) {
    e.tile.alt = 'All Locations at wayand'; 
}).addTo(map1)
          .bindPopup(restaurant.tags.name);
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
    foodPlacesContainer.innerHTML = '<div class="mb-4 text-right"><p class="text-white-50">Unable to load restaurants.</p></div>';
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