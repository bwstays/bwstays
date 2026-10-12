// "Food and dine near this place" widget used on every attraction page.
// Reads the static dataset data/food-places.json (built by scripts/build-food.mjs
// from OpenStreetMap, ODbL) so it needs no third-party API at view time and keeps
// working on free static hosting.
//
// The list is a compact, scrollable widget the same height as the map: one small
// row per place (name, kind, distance). Selecting a row pans the map and opens the
// place's popup, which holds the details (hours, phone, diet, directions).
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('#food-places');
  if (!section) return;
  const centerAttr = section.getAttribute('data-center');
  if (!centerAttr) return;
  const [lat, lng] = centerAttr.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const RADIUS_M = 4000;
  const MAX_LISTED = 12;
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
  }).addTo(map1).bindPopup('You are here');
  L.circle([lat, lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.2,
    radius: RADIUS_M
  }).addTo(map1);

  const foodPlacesContainer = document.getElementById('food-list');
  if (!foodPlacesContainer) return;
  foodPlacesContainer.classList.add('bw-food-widget');

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rad = (d) => (d * Math.PI) / 180;
  const metersBetween = (aLat, aLon, bLat, bLon) => {
    const h = Math.sin(rad(bLat - aLat) / 2) ** 2 +
      Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLon - aLon) / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  };
  const KINDS = {
    restaurant: 'Restaurant', cafe: 'Cafe', fast_food: 'Fast food', food_court: 'Food court',
    bar: 'Bar', pub: 'Pub', ice_cream: 'Ice cream', 'shop:bakery': 'Bakery',
    'shop:confectionery': 'Sweets', 'shop:sweets': 'Sweets', 'shop:pastry': 'Pastry', 'shop:deli': 'Deli'
  };
  const kindOf = (p) => (p.cuisine && p.cuisine.length ? p.cuisine.slice(0, 2).join(', ') : KINDS[p.kind] || 'Food');
  const dietOf = (p) => (p.vegetarian === 'only' ? 'Pure veg' : p.vegetarian ? 'Veg options' : '');
  const popupOf = (p, km) => {
    const rows = [];
    if (p.address) rows.push(esc(p.address));
    if (p.opening_hours) rows.push('Hours: ' + esc(p.opening_hours));
    if (p.phone) rows.push('<a href="tel:' + esc(p.phone.replace(/[^+\d]/g, '')) + '">' + esc(p.phone) + '</a>');
    const tags = [dietOf(p), p.halal ? 'Halal' : '', p.takeaway ? 'Takeaway' : '', p.delivery ? 'Delivery' : '']
      .filter(Boolean).join(' &middot; ');
    if (tags) rows.push(tags);
    return '<strong>' + esc(p.name) + '</strong><br>' + esc(kindOf(p)) + ' &middot; ' + km + ' km' +
      (rows.length ? '<br><span class="small">' + rows.join('<br>') + '</span>' : '') +
      '<br><a target="_blank" rel="noopener noreferrer nofollow" href="https://www.google.com/maps/dir/?api=1&origin=' +
      lat + ',' + lng + '&destination=' + p.lat + ',' + p.lon + '">Directions</a>';
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
        chosen = all.filter((x) => x.d <= FALLBACK_MAX_M).slice(0, 6);
      }
      if (!chosen.length) {
        foodPlacesContainer.innerHTML = '<p class="bw-food-empty">No food places are mapped near here yet. You can add them on OpenStreetMap.</p>';
        return;
      }

      const markers = [];
      const bounds = [[lat, lng]];
      const rows = chosen.map(({ p, d }, i) => {
        bounds.push([p.lat, p.lon]);
        const km = (d / 1000).toFixed(1);
        const marker = L.marker([p.lat, p.lon], {
          title: p.name,
          icon: L.icon({
            iconUrl: 'https://www.bwstays.com/assets/img/logo/pin.png',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(map1).bindPopup(popupOf(p, km));
        markers.push(marker);
        const diet = dietOf(p);
        const open = p.opening_hours ? '<span class="bw-food-chip" title="' + esc(p.opening_hours) + '">Hours</span>' : '';
        return '<li><button type="button" class="bw-food-item" data-i="' + i + '" aria-label="Show ' + esc(p.name) + ' on the map">' +
          '<span class="bw-food-main"><span class="bw-food-name">' + esc(p.name) + '</span>' +
          '<span class="bw-food-meta">' + esc(kindOf(p)) + (diet ? ' &middot; ' + esc(diet) : '') + '</span></span>' +
          '<span class="bw-food-side">' + open + '<span class="bw-food-km">' + km + ' km</span></span>' +
          '</button></li>';
      });
      foodPlacesContainer.innerHTML = '<ul class="bw-food-ul">' + rows.join('') + '</ul>';

      foodPlacesContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.bw-food-item');
        if (!btn) return;
        const marker = markers[Number(btn.getAttribute('data-i'))];
        if (!marker) return;
        map1.setView(marker.getLatLng(), Math.max(map1.getZoom(), 15));
        marker.openPopup();
        foodPlacesContainer.querySelectorAll('.bw-food-item.active').forEach((n) => n.classList.remove('active'));
        btn.classList.add('active');
      });

      if (bounds.length > 1) map1.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    })
    .catch(() => {
      foodPlacesContainer.innerHTML = '<p class="bw-food-empty">Unable to load nearby food places right now.</p>';
    });
});
