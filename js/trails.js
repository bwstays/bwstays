/*
 * Trails planner (bw-one-day-trails-kalpetta-wayanad.html).
 * Builds 2, 3, 5 or 7 day trips from the villa in Kalpetta, by area and by interest, from the site's own data:
 *   data/map-places.json      places with a trusted coordinate, category, image and road km from Kalpetta
 *   locations (nearbylocationsdata.js)  road km between places (0 = unknown, then straight line x 1.4)
 *   siteData (sitedata.js)    hours to spend (hrs), timing, weekly holiday
 *   data/food-places.json     places to eat (OpenStreetMap): one lunch suggestion a day, near the stop reached around midday
 * The map draws each day's road route from the public OSRM server (OpenStreetMap data), one request per day, at
 * most one a second, kept in the browser for a week; until a route arrives, or if it cannot be loaded, a dashed
 * line shows the order of the stops.
 * "Print / Save as PDF" prints the trail only (css/trails.css @media print): a summary header, the days and the
 * map; the browser's print dialog saves it as a PDF.
 * Every block is a portlet the visitor can collapse or remove; removed portlets and stops can be restored.
 * The choice is kept in the URL (?days=3&areas=n,e&interests=waterfalls&pace=balanced) so a trail can be shared.
 */
(function () {
  'use strict';
  var root = document.getElementById('trails-app');
  if (!root) return;

  var BASE = { name: 'the villa', lat: 11.605787, lon: 76.083311 };
  var DAY_HOURS = 9;          // leave about 8:30, back by about 17:30
  var KMH = 28;               // average driving speed on Wayanad roads (estimate)
  var PACE = { relaxed: 3, balanced: 4, packed: 5 };
  var COLORS = ['#3f9f99', '#e0883a', '#8e6cc9', '#3f7fc9', '#c9506b', '#b8a13a', '#5fae5b'];
  var OSRM = 'https://router.project-osrm.org/route/v1/driving/';
  var ROUTE_DAYS = 7;         // keep a loaded route this many days in the browser
  var mapGen = 0;             // bumps on every redraw, so a late route answer for an old map is ignored
  var NEAR_KM = 12;           // road km: closer than this is "around Kalpetta" whatever the direction
  // must-see places (owner's choice, by place id in data/sitedata.js): a trip that matches them always includes
  // them, from the first day. 18 Chembra Peak, 44 Pookode Lake, 21 Edakkal Caves, 45 Banasura Sagar Dam.
  var MUST_SEE = [18, 44, 21, 45];
  var AREAS = [
    { key: 'c', label: 'Around Kalpetta', towns: 'within ' + NEAR_KM + ' km' },
    { key: 'n', label: 'North', towns: 'Mananthavady, Thirunelli' },
    { key: 'e', label: 'East', towns: 'Sultan Bathery, Ambalavayal' },
    { key: 's', label: 'South', towns: 'Meppadi, Chembra, Vythiri' },
    { key: 'w', label: 'West', towns: 'Banasura, Padinjarathara' },
  ];
  var PRESETS = [
    { title: '2-day weekend: waterfalls & viewpoints', text: 'Falls, lakes and view points close to Kalpetta.', days: 2, areas: [], interests: ['waterfalls', 'romantic'], pace: 'balanced' },
    { title: '2-day pilgrim trail', text: 'Temples, churches and mosques across the district.', days: 2, areas: [], interests: ['pilgrimage', 'culthist'], pace: 'balanced' },
    { title: '3-day wildlife & heritage', text: 'Sanctuaries, museums and history.', days: 3, areas: [], interests: ['wildlife', 'museums', 'culthist', 'tribal'], pace: 'balanced' },
    { title: '3-day trekking & adventure', text: 'Peaks, hills, caves and adventure sports.', days: 3, areas: [], interests: ['trucking', 'sporting', 'romantic'], pace: 'packed' },
    { title: '5-day all of Wayanad', text: 'A bit of everything, one area a day.', days: 5, areas: [], interests: [], pace: 'balanced' },
    { title: '7-day slow Wayanad', text: 'A week at an easy pace: every area, three stops a day.', days: 7, areas: [], interests: [], pace: 'relaxed' },
  ];

  var places = [];
  var food = [];              // places to eat, loaded after the plan is shown
  var LUNCH_AFTER_H = 3.5;    // lunch after the stop reached about 3.5 h into the day (about noon)
  var LUNCH_KINDS = ['restaurant', 'food_court', 'fast_food', 'cafe'];
  var categories = [];
  var state = { days: 2, areas: [], interests: [], pace: 'balanced' };
  var plan = [];              // [{ area, stops: [place] }]
  var removedStops = [];      // [{ day, place, index }]
  var hidden = [];            // portlet ids
  var map = null;
  var tiles = null;

  // ------------------------------------------------------------ helpers
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function store(key, value) {
    try { if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(value)); } catch (e) { return null; }
  }
  function straightKm(a, b) {
    var r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  }
  // road km from OpenStreetMap routes; when a pair has none, straight line x 1.4 (marked as an estimate)
  function knownKm(a, b) {
    if (a === BASE) return b.km || 0;
    if (b === BASE) return a.km || 0;
    try {
      var row = locations.distances[a.id];
      return (row && row[b.id - 1]) || 0;
    } catch (e) { return 0; /* matrix not loaded */ }
  }
  function roadKm(a, b) { return knownKm(a, b) || Math.round(straightKm(a, b) * 1.4); }
  function areaOf(p) {
    if (p.km && p.km <= NEAR_KM) return 'c';
    var y = p.lat - BASE.lat, x = (p.lon - BASE.lon) * Math.cos(BASE.lat * Math.PI / 180);
    var deg = (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;   // 0 = north, 90 = east
    return deg >= 315 || deg < 45 ? 'n' : deg < 135 ? 'e' : deg < 225 ? 's' : 'w';
  }
  function areaInfo(key) { return AREAS.filter(function (a) { return a.key === key; })[0]; }
  function siteItem(id) {
    if (typeof siteData === 'undefined') return null;
    for (var k in siteData) for (var i = 0; i < siteData[k].length; i++) if (siteData[k][i].id === id) return siteData[k][i];
    return null;
  }
  function hoursAt(p) { return Number(p.hrs) || 2; }
  function fmtH(h) { var r = Math.round(h * 2) / 2; return (r % 1 ? r.toFixed(1) : String(r)) + ' h'; }

  // ------------------------------------------------------------ planning
  function dayStats(stops) {
    var km = 0, prev = BASE;
    stops.forEach(function (s) { km += roadKm(prev, s); prev = s; });
    if (stops.length) km += roadKm(prev, BASE);
    var visit = stops.reduce(function (a, s) { return a + hoursAt(s); }, 0);
    return { km: km, drive: km / KMH, visit: visit, total: km / KMH + visit };
  }
  // grow a day from the stops it already has: add the places that make the smallest detour, each inserted
  // where it costs least, until the day is full
  function growDay(seed, pool, maxStops) {
    var stops = seed.slice();
    var left = pool.filter(function (p) { return stops.indexOf(p) < 0; });
    while (stops.length < maxStops && left.length) {
      var best = null;
      left.forEach(function (p) {
        for (var at = 0; at <= stops.length; at++) {
          var a = at ? stops[at - 1] : BASE, b = at < stops.length ? stops[at] : BASE;
          var cost = roadKm(a, p) + roadKm(p, b) - roadKm(a, b);
          if (!best || cost < best.cost) best = { p: p, at: at, cost: cost };
        }
      });
      var trial = stops.slice();
      trial.splice(best.at, 0, best.p);
      if (dayStats(trial).total > DAY_HOURS) break;
      stops = trial;
      left.splice(left.indexOf(best.p), 1);
    }
    return stops;
  }
  function dayScore(stops) { return stops.length ? stops.length * 10 - dayStats(stops).drive * 3 : -Infinity; }
  // one day in one area: try every place as the anchor and keep the day with the most stops and the least
  // driving, preferring farther anchors (the reason to drive out there); the chosen places leave the pool
  // A day in an area with must-see places is built around them: the first one is the anchor and the others
  // join when they fit, before any other place.
  function planDay(pool, maxStops) {
    var bestDay = null, bestScore = -Infinity;
    var musts = pool.filter(function (p) { return p.must && dayStats([p]).total <= DAY_HOURS; });
    if (musts.length) {
      bestDay = growDay(growDay([musts[0]], musts, maxStops), pool, maxStops);
    }
    if (!bestDay) pool.forEach(function (anchor) {
      if (dayStats([anchor]).total > DAY_HOURS) return;
      var stops = growDay([anchor], pool, maxStops);
      var score = dayScore(stops) + roadKm(BASE, anchor) / 15;
      if (score > bestScore) { bestScore = score; bestDay = stops; }
    });
    (bestDay || []).forEach(function (p) { pool.splice(pool.indexOf(p), 1); });
    return bestDay || [];
  }
  function buildPlan() {
    var excluded = store('bwTrailsExcluded') || [];
    var cand = places.filter(function (p) {
      return excluded.indexOf(p.id) < 0 &&
        (!state.interests.length || state.interests.indexOf(p.cat) >= 0) &&
        (!state.areas.length || state.areas.indexOf(p.area) >= 0);
    });
    var byArea = {};
    cand.forEach(function (p) { (byArea[p.area] = byArea[p.area] || []).push(p); });
    var days = [], used = {};
    var maxStops = PACE[state.pace] || 4;
    for (var d = 0; d < state.days; d++) {
      // a new area every day while there are unvisited ones; among those, the area that gives the best day
      var keys = Object.keys(byArea).filter(function (k) { return byArea[k].length; });
      if (!keys.length) break;
      // areas with must-see places still to visit come first, so even a 2-day trip includes them
      var mustKeys = keys.filter(function (k) { return byArea[k].some(function (p) { return p.must; }); });
      if (mustKeys.length) keys = mustKeys;
      var least = Math.min.apply(null, keys.map(function (k) { return used[k] || 0; }));
      var pick = null, pickScore = -Infinity;
      keys.filter(function (k) { return (used[k] || 0) === least; }).forEach(function (k) {
        var trial = planDay(byArea[k].slice(), maxStops);
        var sc = dayScore(trial);
        if (sc > pickScore) { pickScore = sc; pick = k; }
      });
      var stops = planDay(byArea[pick], maxStops);
      if (!stops.length) break;
      days.push({ area: pick, stops: stops });
      used[pick] = (used[pick] || 0) + 1;
    }
    plan = days;
    removedStops = [];
  }

  // ------------------------------------------------------------ portlets
  function portlet(id, title, sub, body, opts) {
    opts = opts || {};
    var head = el('div', { class: 'tr-portlet-head' });
    if (opts.badge) head.appendChild(opts.badge);
    var h = el('h2', { class: 'tr-portlet-title', id: id + '-title' }, [title]);
    if (sub) h.appendChild(el('span', { class: 'tr-portlet-sub', text: sub }));
    head.appendChild(h);
    var box = el('section', { class: 'tr-portlet', id: id, 'aria-labelledby': id + '-title' });
    head.appendChild(el('button', {
      type: 'button', class: 'tr-portlet-btn', 'aria-expanded': 'true', title: 'Collapse', 'aria-label': 'Collapse ' + title, text: '−',
      onclick: function () {
        var c = box.classList.toggle('is-collapsed');
        this.textContent = c ? '+' : '−';
        this.setAttribute('aria-expanded', String(!c));
        this.title = c ? 'Expand' : 'Collapse';
      },
    }));
    if (opts.removable !== false) {
      head.appendChild(el('button', {
        type: 'button', class: 'tr-portlet-btn', title: 'Remove', 'aria-label': 'Remove ' + title, text: '×',
        onclick: function () { hidden.push(id); store('bwTrailsHidden', hidden); render(); },
      }));
    }
    box.appendChild(head);
    box.appendChild(el('div', { class: 'tr-portlet-body' }, [body]));
    if (hidden.indexOf(id) >= 0) box.hidden = true;
    return box;
  }

  function chips(list, selected, onToggle) {
    var wrap = el('div', { class: 'tr-chips', role: 'group' });
    list.forEach(function (item) {
      wrap.appendChild(el('button', {
        type: 'button', class: 'tr-chip', 'aria-pressed': String(selected(item.key)), text: item.label,
        title: item.title || '', onclick: function () { onToggle(item.key); },
      }));
    });
    return wrap;
  }

  function controls() {
    var body = el('div');
    body.appendChild(el('div', { class: 'tr-field' }, [
      el('span', { class: 'tr-label', text: 'How many days' }),
      chips([{ key: 2, label: '2 days' }, { key: 3, label: '3 days' }, { key: 5, label: '5 days' }, { key: 7, label: '7 days' }],
        function (k) { return state.days === k; }, function (k) { state.days = k; update(); }),
    ]));
    body.appendChild(el('div', { class: 'tr-field' }, [
      el('span', { class: 'tr-label', text: 'Which part of Wayanad (none = all)' }),
      chips(AREAS.map(function (a) { return { key: a.key, label: a.label + ': ' + a.towns }; }),
        function (k) { return state.areas.indexOf(k) >= 0; }, function (k) { toggle(state.areas, k); update(); }),
    ]));
    body.appendChild(el('div', { class: 'tr-field' }, [
      el('span', { class: 'tr-label', text: 'Interests (none = everything)' }),
      chips(categories, function (k) { return state.interests.indexOf(k) >= 0; }, function (k) { toggle(state.interests, k); update(); }),
    ]));
    body.appendChild(el('div', { class: 'tr-field' }, [
      el('span', { class: 'tr-label', text: 'Pace' }),
      chips([{ key: 'relaxed', label: 'Relaxed (3 stops a day)' }, { key: 'balanced', label: 'Balanced (4)' }, { key: 'packed', label: 'Packed (5)' }],
        function (k) { return state.pace === k; }, function (k) { state.pace = k; update(); }),
    ]));
    var excluded = store('bwTrailsExcluded') || [];
    body.appendChild(el('div', { class: 'tr-actions' }, [
      el('button', { type: 'button', class: 'tr-btn', text: 'Copy link to this trail', onclick: copyLink }),
      el('button', { type: 'button', class: 'tr-btn', text: 'Print / Save as PDF', onclick: printTrail }),
      excluded.length ? el('button', {
        type: 'button', class: 'tr-btn is-ghost', text: 'Bring back ' + excluded.length + ' skipped place' + (excluded.length > 1 ? 's' : ''),
        onclick: function () { store('bwTrailsExcluded', []); update(); },
      }) : null,
    ]));
    body.appendChild(el('p', { class: 'tr-note', id: 'tr-copy-note', 'aria-live': 'polite' }));
    return portlet('tr-plan', 'Plan your trail', 'Days start and end at the villa in Kalpetta', body);
  }

  function presets() {
    var grid = el('div', { class: 'tr-presets' });
    PRESETS.forEach(function (p) {
      grid.appendChild(el('button', {
        type: 'button', class: 'tr-preset',
        onclick: function () { state = { days: p.days, areas: p.areas.slice(), interests: p.interests.slice(), pace: p.pace }; update(); scrollToDays(); },
      }, [el('strong', { text: p.title }), el('span', { text: p.text })]));
    });
    return portlet('tr-presets', 'Ready-made trails', 'Pick one, then change anything above', grid);
  }

  // the stop after which to have lunch, and the nearest place to eat to it (restaurants first, then
  // food courts, fast food, cafes, bakeries); straight-line km, so "about"
  function lunchFor(stops) {
    if (!food.length || !stops.length) return null;
    var t = 0, prev = BASE, at = stops.length - 1;
    for (var j = 0; j < stops.length; j++) {
      t += roadKm(prev, stops[j]) / KMH + hoursAt(stops[j]);
      prev = stops[j];
      if (t >= LUNCH_AFTER_H) { at = j; break; }
    }
    var near = null;
    food.forEach(function (f) {
      var km = straightKm(stops[at], f);
      var rank = LUNCH_KINDS.indexOf(f.kind) >= 0 ? LUNCH_KINDS.indexOf(f.kind) : LUNCH_KINDS.length;
      var score = km + rank * 1.5;   // a restaurant 1.5 km farther beats a cafe
      if (km <= 10 && (!near || score < near.score)) near = { f: f, km: km, score: score };
    });
    return { at: at, place: near && near.f, km: near && near.km };
  }
  function lunchRow(day, i, lunch) {
    var id = 'tr-lunch-' + (i + 1);
    var stop = day.stops[lunch.at];
    var main;
    if (lunch.place) {
      var f = lunch.place;
      var meta = [String(f.kind || '').replace('shop:', '').replace('_', ' ')];
      if (f.cuisine && f.cuisine.length) meta.push(f.cuisine.join(', '));
      if (f.vegetarian === true || f.vegetarian === 'yes' || f.vegetarian === 'only') meta.push('vegetarian options');
      if (f.opening_hours) meta.push('open ' + f.opening_hours);
      main = el('div', { class: 'tr-stop-main' }, [
        el('span', { class: 'tr-leg', text: 'Lunch: about ' + (Math.round(lunch.km * 10) / 10) + ' km from ' + stop.name + ' (straight line)' }),
        el('a', { class: 'tr-stop-name', href: f.osm_url, target: '_blank', rel: 'noopener', text: f.name || 'Place to eat' }),
        el('span', { class: 'tr-stop-meta', text: meta.join(' · ') }),
      ]);
    } else {
      main = el('div', { class: 'tr-stop-main' }, [
        el('span', { class: 'tr-leg', text: 'Lunch' }),
        el('span', { class: 'tr-stop-meta', text: 'No place to eat is listed within 10 km of ' + stop.name + ' on OpenStreetMap: carry lunch or eat in the nearest town.' }),
      ]);
    }
    return el('li', { class: 'tr-stop tr-lunch', id: id }, [
      el('span', { class: 'tr-lunch-icon', 'aria-hidden': 'true', html: '&#127860;' }),
      main,
      el('button', {
        type: 'button', class: 'tr-portlet-btn', title: 'Remove the lunch stop', 'aria-label': 'Remove the lunch stop from day ' + (i + 1), text: '×',
        onclick: function () { hidden.push(id); store('bwTrailsHidden', hidden); render(); },
      }),
    ]);
  }

  function dayPortlet(day, i) {
    var st = dayStats(day.stops);
    var a = areaInfo(day.area);
    var list = el('ol', { class: 'tr-stops' });
    var prev = BASE;
    var lunch = hidden.indexOf('tr-lunch-' + (i + 1)) < 0 ? lunchFor(day.stops) : null;
    day.stops.forEach(function (p, j) {
      var item = siteItem(p.id) || {};
      var meta = [p.must ? 'Must-see' : '', p.label, 'about ' + fmtH(hoursAt(p)) + ' there'].filter(Boolean);
      if (Array.isArray(item.timing) && item.timing.length) meta.push('open ' + item.timing.join(', '));
      if (item.holidays && !/^(na|none|-)$/i.test(item.holidays)) meta.push('closed ' + item.holidays);
      list.appendChild(el('li', { class: 'tr-stop' }, [
        el('img', { src: p.img, alt: '', loading: 'lazy', decoding: 'async', width: '72', height: '54' }),
        el('div', { class: 'tr-stop-main' }, [
          el('span', { class: 'tr-leg', text: (j + 1) + '. about ' + roadKm(prev, p) + ' km from ' + (prev === BASE ? 'the villa' : prev.name) + (knownKm(prev, p) ? '' : ' (straight-line estimate)') }),
          el('a', { class: 'tr-stop-name', href: p.url, text: p.name }),
          el('span', { class: 'tr-stop-meta', text: meta.join(' · ') }),
        ]),
        el('button', {
          type: 'button', class: 'tr-portlet-btn', title: 'Remove this stop', 'aria-label': 'Remove ' + p.name + ' from day ' + (i + 1), text: '×',
          onclick: function () { removedStops.push({ day: i, place: p, index: j }); day.stops.splice(j, 1); render(); },
        }),
      ]));
      if (lunch && lunch.at === j) list.appendChild(lunchRow(day, i, lunch));
      prev = p;
    });
    var body = el('div', {}, [
      day.stops.length ? list : el('p', { class: 'tr-empty', text: 'No stops left for this day.' }),
      el('p', { class: 'tr-day-foot', text: day.stops.length ? 'Back to the villa: about ' + roadKm(prev, BASE) + ' km. Distances are road km from OpenStreetMap; times are estimates.' : '' }),
    ]);
    var badge = el('span', { class: 'tr-day-badge', style: 'background:' + COLORS[i % COLORS.length], text: String(i + 1) });
    var sub = a.label + ' (' + a.towns + ') · ' + day.stops.length + ' stops · about ' + st.km + ' km, ' + fmtH(st.drive) + ' driving, ' + fmtH(st.total) + ' in all';
    return portlet('tr-day-' + (i + 1), 'Day ' + (i + 1), sub, body, { badge: badge });
  }

  function mapPortlet() {
    var body = el('div', {}, [
      el('div', { class: 'tr-map', id: 'tr-map', role: 'region', 'aria-label': 'Map of the trail' }),
      el('div', { class: 'tr-legend' }, plan.map(function (d, i) {
        return el('span', {}, [el('i', { style: 'background:' + COLORS[i % COLORS.length] }), 'Day ' + (i + 1) + ' ',
          el('small', { class: 'tr-route-km', id: 'tr-route-' + (i + 1) })]);
      })),
      el('p', { class: 'tr-note', text: 'Solid lines follow the roads (routes from OSRM on OpenStreetMap data); a dashed line shows the order of the stops while a route loads or if it cannot be loaded. Map data © OpenStreetMap contributors.' }),
    ]);
    return portlet('tr-map-box', 'Trail map', 'Numbered stops, one colour per day', body);
  }

  function tipsPortlet() {
    var ul = el('ul', { class: 'tr-tips' });
    [
      'Opening hours and weekly holidays are shown where the place page has them; check the place page before you go, as they change.',
      'Driving times are estimates at about ' + KMH + ' km/h on hill roads; leave early on days with more than 80 km.',
      'Use × on a stop to skip it, or on any box to hide it. Hidden boxes come back from the bar at the top.',
      'Lunch is the nearest place to eat on OpenStreetMap to the stop you reach around midday; check that it is open. Missing hours or places can be added on OpenStreetMap.',
      'Copy the link to share the trail; it opens with the same days, areas, interests and pace.',
    ].forEach(function (t) { ul.appendChild(el('li', { text: t })); });
    return portlet('tr-tips', 'Good to know', '', ul);
  }

  function hiddenBar() {
    var labels = { 'tr-plan': 'Plan your trail', 'tr-presets': 'Ready-made trails', 'tr-map-box': 'Trail map', 'tr-tips': 'Good to know' };
    var bar = el('div', { class: 'tr-hidden', id: 'tr-hidden' });
    var items = hidden.slice();
    removedStops.forEach(function (r) { items.push(r); });
    if (!items.length) { bar.hidden = true; return bar; }
    bar.appendChild(el('span', { text: 'Hidden:' }));
    hidden.forEach(function (id) {
      var name = labels[id] || (id.indexOf('tr-lunch-') === 0 ? 'Lunch, day ' + id.slice(9) : id.replace('tr-day-', 'Day '));
      bar.appendChild(el('button', {
        type: 'button', class: 'tr-restore', text: '+ ' + name,
        onclick: function () { hidden.splice(hidden.indexOf(id), 1); store('bwTrailsHidden', hidden); render(); },
      }));
    });
    removedStops.forEach(function (r, k) {
      bar.appendChild(el('button', {
        type: 'button', class: 'tr-restore', text: '+ ' + r.place.name + ' (day ' + (r.day + 1) + ')',
        onclick: function () { plan[r.day].stops.splice(Math.min(r.index, plan[r.day].stops.length), 0, r.place); removedStops.splice(k, 1); render(); },
      }));
    });
    if (removedStops.length) {
      bar.appendChild(el('button', {
        type: 'button', class: 'tr-restore', text: 'Skip removed stops and re-plan',
        onclick: function () {
          var ex = store('bwTrailsExcluded') || [];
          removedStops.forEach(function (r) { if (ex.indexOf(r.place.id) < 0) ex.push(r.place.id); });
          store('bwTrailsExcluded', ex); update();
        },
      }));
    }
    return bar;
  }

  // ------------------------------------------------------------ render
  function render() {
    root.innerHTML = '';
    root.appendChild(hiddenBar());
    root.appendChild(controls());
    root.appendChild(presets());
    var days = el('div', { class: 'tr-days', id: 'tr-days' });
    if (!plan.length) {
      days.appendChild(el('p', { class: 'tr-empty', text: 'No places match these choices. Add an area or an interest, or bring back skipped places.' }));
    } else if (plan.length < state.days) {
      root.appendChild(el('p', { class: 'tr-note', text: 'Only ' + plan.length + ' day(s) of places match these choices; add areas or interests for a longer trip.' }));
    }
    root.appendChild(printHead());
    plan.forEach(function (d, i) { days.appendChild(dayPortlet(d, i)); });
    root.appendChild(days);
    if (plan.length) {
      root.appendChild(el('div', { class: 'tr-actions tr-print-bar' }, [
        el('button', { type: 'button', class: 'tr-btn', text: 'Print / Save as PDF', onclick: printTrail }),
      ]));
    }
    if (plan.length) root.appendChild(mapPortlet());
    root.appendChild(tipsPortlet());
    drawMap();
  }

  function drawMap() {
    mapGen++;
    var routeQueue = [];
    if (map) { map.remove(); map = null; }
    var box = document.getElementById('tr-map');
    if (!box || typeof L === 'undefined' || document.getElementById('tr-map-box').hidden) return;
    map = L.map(box, { scrollWheelZoom: false });
    tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors, routes OSRM', maxZoom: 18 }).addTo(map);
    var bounds = [[BASE.lat, BASE.lon]];
    L.marker([BASE.lat, BASE.lon], { title: 'Black & White Workations (the villa)' }).addTo(map).bindPopup('<strong>Black &amp; White Workations</strong><br>Kalpetta: every day starts here');
    plan.forEach(function (d, i) {
      if (hidden.indexOf('tr-day-' + (i + 1)) >= 0) return;
      var color = COLORS[i % COLORS.length];
      var line = [[BASE.lat, BASE.lon]];
      d.stops.forEach(function (p, j) {
        var icon = L.divIcon({ className: '', html: '<div class="tr-num" style="background:' + color + '">' + (j + 1) + '</div>', iconSize: [24, 24], iconAnchor: [12, 12] });
        L.marker([p.lat, p.lon], { icon: icon, title: 'Day ' + (i + 1) + ': ' + p.name }).addTo(map)
          .bindPopup('<strong>Day ' + (i + 1) + ', stop ' + (j + 1) + '</strong><br><a href="' + p.url + '">' + p.name + '</a>');
        line.push([p.lat, p.lon]);
        bounds.push([p.lat, p.lon]);
      });
      line.push([BASE.lat, BASE.lon]);
      var dashed = L.polyline(line, { color: color, weight: 3, opacity: 0.85, dashArray: '6 6' }).addTo(map);
      routeQueue.push({ day: i, pts: line, dashed: dashed, color: color });
    });
    map.fitBounds(bounds, { padding: [25, 25], maxZoom: 12 });
    loadRoutes(routeQueue, mapGen);
  }

  // road routes, one day at a time and at most one request a second (the public OSRM server's limit)
  function routeKey(pts) { return 'bwRoute:' + pts.map(function (p) { return p[0].toFixed(4) + ',' + p[1].toFixed(4); }).join(';'); }
  function cachedRoute(pts) {
    var hit = store(routeKey(pts));
    return hit && hit.t > Date.now() - ROUTE_DAYS * 864e5 ? hit : null;
  }
  function loadRoutes(queue, gen) {
    var job = queue.shift();
    if (!job || gen !== mapGen || !map) return;
    var hit = cachedRoute(job.pts);
    if (hit) { drawRoute(job, hit, gen); loadRoutes(queue, gen); return; }
    var url = OSRM + job.pts.map(function (p) { return p[1].toFixed(5) + ',' + p[0].toFixed(5); }).join(';') + '?overview=full&geometries=geojson';
    fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var r = j && j.code === 'Ok' && j.routes && j.routes[0];
      if (r) {
        var route = { t: Date.now(), km: Math.round(r.distance / 1000), h: r.duration / 3600,
          line: r.geometry.coordinates.map(function (c) { return [Math.round(c[1] * 1e5) / 1e5, Math.round(c[0] * 1e5) / 1e5]; }) };
        store(routeKey(job.pts), route);
        drawRoute(job, route, gen);
      }
    }).catch(function () { /* keep the dashed line */ }).then(function () {
      setTimeout(function () { loadRoutes(queue, gen); }, 1100);
    });
  }
  function drawRoute(job, route, gen) {
    if (gen !== mapGen || !map) return;
    map.removeLayer(job.dashed);
    L.polyline(route.line, { color: '#000', weight: 7, opacity: 0.35 }).addTo(map);
    L.polyline(route.line, { color: job.color, weight: 4, opacity: 0.95 }).addTo(map)
      .bindTooltip('Day ' + (job.day + 1) + ': road route about ' + route.km + ' km, ' + fmtH(route.h) + ' driving (OSRM)', { sticky: true });
    var note = document.getElementById('tr-route-' + (job.day + 1));
    if (note) note.textContent = 'road route about ' + route.km + ' km';
  }

  // ------------------------------------------------------------ print
  function printHead() {
    var names = function (list, all) { return list.length ? list.join(', ') : all; };
    var areas = names(state.areas.map(function (k) { return areaInfo(k).label; }), 'all areas');
    var ints = names(state.interests.map(function (k) {
      var c = categories.filter(function (x) { return x.key === k; })[0];
      return c ? c.label.replace(/ \(\d+\)$/, '') : k;
    }), 'everything');
    var km = plan.reduce(function (a, d) { return a + dayStats(d.stops).km; }, 0);
    return el('div', { class: 'tr-print-head', 'aria-hidden': 'true' }, [
      el('p', { class: 'tr-print-brand', text: 'Black & White Workations · Kalpetta, Wayanad' }),
      el('h2', { text: plan.length + '-day Wayanad trail' }),
      el('p', { text: 'Areas: ' + areas + ' · Interests: ' + ints + ' · Pace: ' + state.pace + ' · about ' + km + ' km in all' }),
      el('p', { text: 'Every day starts and ends at the villa in Kalpetta. Check opening hours on each place page before you go. Printed ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) + '.' }),
      el('p', { class: 'tr-print-link', text: location.origin + location.pathname + '?' + toQuery() }),
    ]);
  }
  // load every photo and fit the map to the printed width before the print dialog opens
  function printTrail() {
    root.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
    document.body.classList.add('tr-printing');
    var done = false;
    function go() {
      if (done) return;
      done = true;
      window.print();
    }
    if (map) {
      map.invalidateSize();
      var b = [];
      map.eachLayer(function (l) { if (l.getLatLng) b.push(l.getLatLng()); });
      if (b.length) map.fitBounds(b, { padding: [20, 20], maxZoom: 12 });
      if (tiles) tiles.once('load', function () { setTimeout(go, 300); });
    }
    setTimeout(go, 2500);   // do not wait for the tiles for ever
  }
  window.addEventListener('afterprint', function () {
    if (!document.body.classList.contains('tr-printing')) return;
    document.body.classList.remove('tr-printing');
    if (map) setTimeout(function () { map.invalidateSize(); }, 100);
  });

  // ------------------------------------------------------------ state
  function toggle(arr, k) { var i = arr.indexOf(k); if (i >= 0) arr.splice(i, 1); else arr.push(k); }
  function toQuery() {
    var q = new URLSearchParams();
    q.set('days', state.days);
    if (state.areas.length) q.set('areas', state.areas.join(','));
    if (state.interests.length) q.set('interests', state.interests.join(','));
    q.set('pace', state.pace);
    return q.toString();
  }
  function fromQuery() {
    var q = new URLSearchParams(location.search);
    var d = Number(q.get('days'));
    if ([2, 3, 5, 7].indexOf(d) >= 0) state.days = d;
    if (q.get('areas')) state.areas = q.get('areas').split(',').filter(function (k) { return areaInfo(k); });
    if (q.get('interests')) state.interests = q.get('interests').split(',').filter(function (k) { return categories.some(function (c) { return c.key === k; }); });
    if (PACE[q.get('pace')]) state.pace = q.get('pace');
  }
  function update() {
    try { history.replaceState(null, '', location.pathname + '?' + toQuery() + location.hash); } catch (e) { /* file:// */ }
    buildPlan();
    render();
  }
  function copyLink() {
    var url = location.origin + location.pathname + '?' + toQuery();
    var note = document.getElementById('tr-copy-note');
    function done(ok) { if (note) note.textContent = ok ? 'Link copied.' : url; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
    else done(false);
  }
  function scrollToDays() {
    var d = document.getElementById('tr-days');
    if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ------------------------------------------------------------ start
  hidden = store('bwTrailsHidden') || [];
  fetch('https://www.bwstays.com/data/map-places.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      categories = (data.categories || []).map(function (c) { return { key: c.key, label: c.label + ' (' + c.count + ')' }; });
      places = (data.places || []).filter(function (p) { return p.lat && p.lon && p.url; }).map(function (p) {
        var item = siteItem(p.id);
        p.hrs = item && item.hrs;
        p.area = areaOf(p);
        p.must = MUST_SEE.indexOf(p.id) >= 0;
        return p;
      });
      fromQuery();
      update();
      // places to eat come second so the trail shows at once; the lunch rows appear when they arrive
      return fetch('https://www.bwstays.com/data/food-places.json').then(function (r) { return r.json(); }).then(function (f) {
        food = (f.places || []).filter(function (x) { return x.lat && x.lon; });
        render();
      }).catch(function () { /* no lunch suggestions */ });
    })
    .catch(function () {
      root.innerHTML = '';
      root.appendChild(el('p', { class: 'tr-empty', text: 'The trail planner could not load the place list. Check your connection and reload the page.' }));
    });

  window.bwTrails = { areaOf: areaOf, roadKm: roadKm, get plan() { return plan; }, get places() { return places; } };
})();
