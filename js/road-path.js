// Road distances and drive paths for the place-page maps (food, EV charging, fuel).
//   bwRoad.near(lat, lng)      -> Promise of { placeId: [road km, driving minutes] } for that page's centre,
//                                 from data/road-near.json (built by scripts/build-road-near.mjs; no API call)
//   bwRoad.path(map, from, to) -> draws the road route from -> to on a Leaflet map (replacing the previous one)
//                                 and resolves with { km, min }; the route comes from the public OSRM server
//                                 on demand (when a row is tapped) and is kept in the browser for a week.
(function () {
  'use strict';
  var OSRM = 'https://router.project-osrm.org/route/v1/driving/';
  var WEEK = 7 * 864e5;
  var nearData = null;

  function key(lat, lng) { return Number(lat).toFixed(5) + ',' + Number(lng).toFixed(5); }
  function store(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }

  function near(lat, lng) {
    if (!nearData) {
      nearData = fetch('https://www.bwstays.com/data/road-near.json')
        .then(function (r) { return r.ok ? r.json() : { centres: {} }; })
        .catch(function () { return { centres: {} }; });
    }
    return nearData.then(function (d) { return (d.centres || {})[key(lat, lng)] || {}; });
  }

  function route(from, to) {
    var k = 'bwPath:' + key(from[0], from[1]) + '>' + key(to[0], to[1]);
    var hit = store(k);
    if (hit && hit.t > Date.now() - WEEK) return Promise.resolve(hit);
    var url = OSRM + from[1].toFixed(5) + ',' + from[0].toFixed(5) + ';' + to[1].toFixed(5) + ',' + to[0].toFixed(5) + '?overview=full&geometries=geojson';
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var r = j && j.code === 'Ok' && j.routes && j.routes[0];
      if (!r) return null;
      var out = { t: Date.now(), km: Math.round(r.distance / 100) / 10, min: Math.max(1, Math.round(r.duration / 60)),
        line: r.geometry.coordinates.map(function (c) { return [Math.round(c[1] * 1e5) / 1e5, Math.round(c[0] * 1e5) / 1e5]; }) };
      store(k, out);
      return out;
    }).catch(function () { return null; });
  }

  function path(map, from, to, color) {
    if (map._bwPath) { map._bwPath.forEach(function (l) { map.removeLayer(l); }); map._bwPath = null; }
    var token = {};
    map._bwPathToken = token;
    return route(from, to).then(function (r) {
      if (!r || map._bwPathToken !== token) return r;
      map._bwPath = [
        L.polyline(r.line, { color: '#000', weight: 7, opacity: 0.3, interactive: false }).addTo(map),
        L.polyline(r.line, { color: color || '#3f7f7b', weight: 4, opacity: 0.95 }).addTo(map)
          .bindTooltip('About ' + r.km + ' km by road, ' + r.min + ' min (OSRM)', { sticky: true }),
      ];
      map.fitBounds(L.latLngBounds(r.line), { padding: [30, 30], maxZoom: 15 });
      return r;
    });
  }

  window.bwRoad = { key: key, near: near, path: path };
})();
