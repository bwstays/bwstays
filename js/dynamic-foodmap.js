// "Food and dine near this place" widget used on every attraction page.
// Reads the static dataset data/food-places.json (built by scripts/build-food.mjs
// from OpenStreetMap, ODbL) so it needs no third-party API at view time and keeps
// working on free static hosting.
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('#food-places');
  if (!section) return;
  const centerAttr = section.getAttribute('data-center');
  if (!centerAttr) return;
  const [lat, lng] = centerAttr.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const RADIUS_M = 4000;
  const MAX_LISTED = 8;
  const FALLBACK_MAX_M = 20000;

  const map1 = L.map('foodmap').setView([lat, lng], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).on('tileload', function (e) {
    e.tile.alt = 'Food joins at wayand';
  }).addTo(map1);
  L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })
  }).addTo(map1).bindPopup('Food and Dine').openPopup();
  L.circle([lat, lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.2,
    radius: RADIUS_M
  }).addTo(map1);

  const foodPlacesContainer = document.getElementById('food-list');

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rad = (d) => (d * Math.PI) / 180;
  const metersBetween = (aLat, aLon, bLat, bLon) => {
    const h = Math.sin(rad(bLat - aLat) / 2) ** 2 +
      Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLon - aLon) / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  };
  const describe = (p) => {
    if (p.cuisine && p.cuisine.length) return p.cuisine.join(', ');
    const kinds = {
      restaurant: 'Restaurant', cafe: 'Cafe', fast_food: 'Fast food', food_court: 'Food court',
      bar: 'Bar', pub: 'Pub', ice_cream: 'Ice cream', 'shop:bakery': 'Bakery',
      'shop:confectionery': 'Sweets', 'shop:sweets': 'Sweets', 'shop:pastry': 'Pastry', 'shop:deli': 'Deli'
    };
    return kinds[p.kind] || 'Food';
  };
  const detailLines = (p) => {
    const out = [];
    if (p.address) out.push(['fa-map-marker-alt', esc(p.address)]);
    if (p.opening_hours) out.push(['fa-clock', esc(p.opening_hours)]);
    if (p.phone) {
      out.push(['fa-phone', '<a class="text-white-50" href="tel:' + esc(p.phone.replace(/[^+\d]/g, '')) + '">' + esc(p.phone) + '</a>']);
    }
    const tags = [];
    if (p.vegetarian === 'only') tags.push('Pure vegetarian');
    else if (p.vegetarian) tags.push('Vegetarian options');
    if (p.halal) tags.push('Halal');
    if (p.takeaway) tags.push('Takeaway');
    if (p.delivery) tags.push('Delivery');
    if (p.outdoor_seating) tags.push('Outdoor seating');
    if (tags.length) out.push(['fa-check', esc(tags.join(' · '))]);
    return out;
  };

  fetch('https://www.bwstays.com/data/food-places.json')
    .then((response) => response.json())
    .then((data) => {
      const all = data.places
        .map((p) => ({ p, d: metersBetween(lat, lng, p.lat, p.lon) }))
        .sort((a, b) => a.d - b.d);
      let chosen = all.filter((x) => x.d <= RADIUS_M).slice(0, MAX_LISTED);
      if (chosen.length < 4) {
        // remote places (waterfalls, passes): fall back to the nearest few
        chosen = all.filter((x) => x.d <= FALLBACK_MAX_M).slice(0, 5);
      }
      if (!chosen.length) {
        foodPlacesContainer.innerHTML = '<div class="mb-4 text-right"><p class="text-white-50">No food places are mapped near here yet. You can add them on OpenStreetMap.</p></div>';
        return;
      }
      const bounds = [[lat, lng]];
      chosen.forEach(({ p, d }) => {
        bounds.push([p.lat, p.lon]);
        const km = (d / 1000).toFixed(1);
        L.marker([p.lat, p.lon], {
          title: p.name,
          icon: L.icon({
            iconUrl: 'https://www.bwstays.com/assets/img/logo/pin.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(map1).bindPopup('<strong>' + esc(p.name) + '</strong><br>' + esc(describe(p)) + ' &middot; ' + km + ' km');

        const lines = detailLines(p)
          .map(([icon, html]) => '<p class="text-white-50 small mb-1"><i class="fas ' + icon + ' text-primary mr-2"></i>' + html + '</p>')
          .join('');
        const html = '<div class="mb-4 text-right">' +
          '<h6 class="text-white">' + esc(p.name) + '</h6>' +
          '<a href="https://www.google.com/maps/dir/?api=1&origin=' + lat + ',' + lng + '&destination=' + p.lat + ',' + p.lon +
          '" target="_blank" rel="noopener noreferrer nofollow" aria-label="Directions to ' + esc(p.name) + '">' +
          '<p class="text-white-50 small mb-1"><i class="fas fa-map-marker-alt text-primary mr-2"></i>' + km + ' km away &middot; Directions</p></a>' +
          '<p class="text-white-50 small mb-1"><i class="fas fa-utensils text-primary mr-2"></i>' + esc(describe(p)) + '</p>' +
          lines + '</div>';
        foodPlacesContainer.insertAdjacentHTML('beforeend', html);
      });
      if (bounds.length > 1) map1.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    })
    .catch(() => {
      foodPlacesContainer.innerHTML = '<div class="mb-4 text-right"><p class="text-white-50">Unable to load nearby food places right now.</p></div>';
    });
});
