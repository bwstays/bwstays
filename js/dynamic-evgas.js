// "Nearby EV charging" and "Nearby gas stations" maps for an attraction page.
// Replaces the old static screenshots (whose pins were not clickable) with two
// interactive Leaflet maps and a short list each. Data is static, so no third-party
// API is called at view time:
//   - gas stations: data/fuel-places.json (OpenStreetMap, ODbL; scripts/build-fuel.mjs)
//   - EV charging:  data/ev-stations.json (hand-maintained; OpenStreetMap has none in Wayanad)
// Each map goes in the element that carries data-evgas, data-kind="ev|gas" and
// data-center="lat, lng".
document.addEventListener('DOMContentLoaded', () => {
  if (typeof L === 'undefined') return;

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rad = (d) => (d * Math.PI) / 180;
  const metersBetween = (aLat, aLon, bLat, bLon) => {
    const h = Math.sin(rad(bLat - aLat) / 2) ** 2 +
      Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLon - aLon) / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  };

  const KINDS = {
    ev: { file: 'ev-stations.json', pin: 'bw-pin-ev', radius: 45000, fallback: 80000, max: 15, empty: 'No charging stations are listed near here yet.' },
    gas: { file: 'fuel-places.json', pin: 'bw-pin-gas', radius: 30000, fallback: 60000, max: 15, empty: 'No fuel stations are mapped near here yet.' },
  };

  function build(container) {
    const kind = KINDS[container.getAttribute('data-kind')];
    const center = (container.getAttribute('data-center') || '').split(',').map(Number);
    if (!kind || center.length !== 2 || center.some((n) => !Number.isFinite(n))) return;
    const lat = center[0];
    const lng = center[1];

    container.innerHTML = '<div class="evgas-map"></div><div class="evgas-list bw-food-widget"><p class="bw-food-empty">Loading&hellip;</p></div>';
    const mapEl = container.querySelector('.evgas-map');
    const listEl = container.querySelector('.evgas-list');

    const map = L.map(mapEl).setView([lat, lng], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.marker([lat, lng], {
      icon: L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', iconSize: [32, 32], iconAnchor: [16, 32] }),
      title: 'You are here',
    }).addTo(map).bindPopup('You are here');

    fetch('https://www.bwstays.com/data/' + kind.file)
      .then((r) => r.json())
      .then((data) => {
        const all = (data.places || data.stations || [])
          .map((p) => ({ p, d: metersBetween(lat, lng, p.lat, p.lon) }))
          .sort((a, b) => a.d - b.d);
        let chosen = all.filter((x) => x.d <= kind.radius).slice(0, kind.max);
        if (chosen.length < 4) chosen = all.filter((x) => x.d <= kind.fallback).slice(0, 6);
        if (!chosen.length) {
          listEl.innerHTML = '<p class="bw-food-empty">' + kind.empty + '</p>';
          return;
        }
        const markers = [];
        const bounds = [[lat, lng]];
        const rows = chosen.map((item, i) => {
          const p = item.p;
          bounds.push([p.lat, p.lon]);
          const km = (item.d / 1000).toFixed(1);
          const label = p.operator || p.brand || '';
          const extra = [];
          if (p.opening_hours) extra.push('Hours: ' + esc(p.opening_hours));
          if (p.fuels && p.fuels.length) extra.push(esc(p.fuels.join(', ')));
          if (p.phone) extra.push('<a href="tel:' + esc(p.phone.replace(/[^+\d]/g, '')) + '">' + esc(p.phone) + '</a>');
          if (p.verified === false) extra.push('Location approximate');
          const popup = '<strong>' + esc(p.name) + '</strong>' + (label && label !== p.name ? '<br>' + esc(label) : '') +
            ' &middot; ' + km + ' km' + (extra.length ? '<br><span class="small">' + extra.join('<br>') + '</span>' : '') +
            '<br><a target="_blank" rel="noopener noreferrer nofollow" href="https://www.google.com/maps/dir/?api=1&origin=' +
            lat + ',' + lng + '&destination=' + p.lat + ',' + p.lon + '">Directions</a>';
          const marker = L.marker([p.lat, p.lon], {
            title: p.name,
            icon: L.divIcon({ className: 'bw-pin ' + kind.pin, html: '<span></span>', iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30] }),
          }).addTo(map).bindPopup(popup);
          markers.push(marker);
          const fallbackLabel = kind.pin === 'bw-pin-ev' ? 'EV charging' : 'Fuel station';
          return '<li><button type="button" class="bw-food-item" data-i="' + i + '" title="Show on the map">' +
            '<span class="bw-food-main"><span class="bw-food-name">' + esc(p.name) + '</span>' +
            '<span class="bw-food-meta">' + esc(label && label !== p.name ? label : fallbackLabel) + '</span></span>' +
            '<span class="bw-food-side"><span class="bw-food-km">' + km + ' km</span></span></button></li>';
        });
        listEl.innerHTML = '<ul class="bw-food-ul">' + rows.join('') + '</ul>';
        listEl.addEventListener('click', (e) => {
          const btn = e.target.closest('.bw-food-item');
          if (!btn) return;
          const marker = markers[Number(btn.getAttribute('data-i'))];
          if (!marker) return;
          map.setView(marker.getLatLng(), Math.max(map.getZoom(), 14));
          marker.openPopup();
          listEl.querySelectorAll('.bw-food-item.active').forEach((n) => n.classList.remove('active'));
          btn.classList.add('active');
        });
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      })
      .catch(() => {
        listEl.innerHTML = '<p class="bw-food-empty">Unable to load this map right now.</p>';
      });
  }

  document.querySelectorAll('[data-evgas]').forEach(build);
});
