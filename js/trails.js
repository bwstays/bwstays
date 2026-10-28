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
  // area-step shortcuts for one kind of place anywhere in Wayanad: they set the interest (step 3) to that category
  var THEMES = [
    { cat: 'wildlife', label: 'Wildlife', icon: 'fa-paw', sub: 'Sanctuaries' },
    { cat: 'trucking', label: 'Trekking', icon: 'fa-hiking', sub: 'Peaks and hills' },
    { cat: 'romantic', label: 'Viewpoints', icon: 'fa-mountain', sub: 'Views, lakes, dams' },
  ];
  var COMPASS = ['n', 'e', 'w', 's'];  // shown in one row, in this order
  var AREAS = [
    { key: 'c', label: 'Around Kalpetta', towns: 'within ' + NEAR_KM + ' km', side: 'within ' + NEAR_KM + ' km' },
    { key: 'n', label: 'North', towns: 'Mananthavady, Thirunelli', side: 'Mananthavady' },
    { key: 'e', label: 'East', towns: 'Sultan Bathery, Ambalavayal', side: 'Sultan Bathery' },
    { key: 's', label: 'South', towns: 'Meppadi, Chembra, Vythiri', side: 'Meppadi, Vythiri' },
    { key: 'w', label: 'West', towns: 'Banasura, Padinjarathara', side: 'Banasura' },
  ];

  var places = [];
  var food = [];              // places to eat, loaded after the plan is shown
  var LUNCH_AFTER_H = 3.5;    // lunch after the stop reached about 3.5 h into the day (about noon)
  var LUNCH_KINDS = ['restaurant', 'food_court', 'fast_food', 'cafe'];
  var categories = [];
  var state = { days: 2, areas: [], interests: [], pace: 'balanced', must: false };   // must: "Must-see highlights" mode
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
      var trial = shortestOrder(stops.concat([best.p]));
      if (dayStats(trial).total > DAY_HOURS) break;
      stops = trial;
      left.splice(left.indexOf(best.p), 1);
    }
    return stops;
  }
  // the order of the day's stops with the fewest road km from the villa and back: every order is tried
  // (a day has at most 5 stops, so at most 120 orders), which also lets more places fit in a day
  function loopKm(order) {
    var km = 0, prev = BASE;
    for (var i = 0; i < order.length; i++) { km += roadKm(prev, order[i]); prev = order[i]; }
    return order.length ? km + roadKm(prev, BASE) : 0;
  }
  function shortestOrder(stops) {
    if (stops.length < 3) return stops.length === 2 && loopKm([stops[1], stops[0]]) < loopKm(stops) ? [stops[1], stops[0]] : stops.slice();
    var best = stops.slice(), bestKm = loopKm(best);
    (function permute(done, rest) {
      if (!rest.length) { var km = loopKm(done); if (km < bestKm) { bestKm = km; best = done; } return; }
      for (var i = 0; i < rest.length; i++) permute(done.concat([rest[i]]), rest.slice(0, i).concat(rest.slice(i + 1)));
    })([], stops);
    return best;
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
  // "Must-see highlights": put the must-see places on as few days as possible with the least driving
  // (every way of sharing them out over the days is tried; each day must fit in DAY_HOURS), whatever
  // their area; returns [[place, ...], ...] in the shortest order, or null when they do not fit
  function shareMusts(musts, maxDays, maxStops) {
    for (var nd = 1; nd <= maxDays; nd++) {
      var best = null, bestKm = Infinity, total = Math.pow(nd, musts.length);
      for (var code = 0; code < total; code++) {
        var groups = [], c = code;
        for (var d = 0; d < nd; d++) groups.push([]);
        musts.forEach(function (m) { groups[c % nd].push(m); c = Math.floor(c / nd); });
        if (groups.some(function (g) { return !g.length || g.length > maxStops; })) continue;
        var ordered = groups.map(shortestOrder);
        if (ordered.some(function (g) { return dayStats(g).total > DAY_HOURS; })) continue;
        var km = ordered.reduce(function (a, g) { return a + loopKm(g); }, 0);
        if (km < bestKm) { bestKm = km; best = ordered; }
      }
      if (best) return best;
    }
    return null;
  }
  function mixedLabel(stops) {
    var seen = [];
    stops.forEach(function (p) { var l = areaInfo(p.area).label; if (seen.indexOf(l) < 0) seen.push(l); });
    return { label: 'Highlights', towns: seen.join(' & ') };
  }
  function dayArea(d) { return d.label || areaInfo(d.area); }

  function buildPlan() {
    var excluded = store('bwTrailsExcluded') || [];
    var cand = places.filter(function (p) {
      return excluded.indexOf(p.id) < 0 &&
        (!state.interests.length || state.interests.indexOf(p.cat) >= 0) &&
        (!state.areas.length || state.areas.indexOf(p.area) >= 0);
    });
    var days = [], used = {};
    var maxStops = PACE[state.pace] || 4;
    if (state.must) {
      // the must-see days first, each filled with the places that make the smallest detour from any area
      var groups = shareMusts(cand.filter(function (p) { return p.must; }), state.days, maxStops) || [];
      groups.forEach(function (g) {
        var pool = cand.filter(function (p) { return g.indexOf(p) < 0; });
        var stops = growDay(g, pool, maxStops);
        stops.forEach(function (p) { cand.splice(cand.indexOf(p), 1); used[p.area] = (used[p.area] || 0) + 1; });
        days.push({ area: stops[0].area, label: mixedLabel(stops), stops: stops });
      });
    }
    var byArea = {};
    cand.forEach(function (p) { (byArea[p.area] = byArea[p.area] || []).push(p); });
    for (var d = days.length; d < state.days; d++) {
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

  var DAYS = [
    { key: 2, label: '2 days', sub: 'Weekend' },
    { key: 3, label: '3 days', sub: 'Long weekend' },
    { key: 5, label: '5 days', sub: 'Most of Wayanad' },
    { key: 7, label: '7 days', sub: 'Slow week' },
  ];
  var PACES = [
    { key: 'relaxed', label: 'Relaxed', sub: '3 places a day', icon: 'fa-coffee' },
    { key: 'balanced', label: 'Balanced', sub: '4 places a day', icon: 'fa-walking' },
    { key: 'packed', label: 'Packed', sub: '5 places a day', icon: 'fa-bolt' },
  ];
  function catIcon(key) {
    var c = categories.filter(function (x) { return x.key === key; })[0];
    return c ? c.icon : 'fa-map-marker-alt';
  }
  function icon(name) { return el('i', { class: 'fas ' + name, 'aria-hidden': 'true' }); }

  // a tile: a big button with an icon, a title and one line of help; aria-pressed shows it is chosen
  function tile(t, pressed, onclick) {
    // every tile has the same shape and size: a round picture on the left (the category photo, an icon or
    // the number of days) and a title with one line of help on the right
    var visual = el('span', t.img ? { class: 'tr-tile-visual has-img', style: 'background-image:url(' + t.img + ')' } : { class: 'tr-tile-visual' }, [
      t.big ? el('span', { class: 'tr-tile-big', text: t.big }) : t.icon ? icon(t.icon) : null,
    ]);
    return el('button', { type: 'button', class: 'tr-tile', 'aria-pressed': String(pressed), onclick: onclick, title: t.label + (t.sub ? ': ' + t.sub : '') }, [
      visual,
      el('span', { class: 'tr-tile-text' }, [
        el('span', { class: 'tr-tile-label', text: t.label }),
        t.sub ? el('span', { class: 'tr-tile-sub', text: t.sub }) : null,
      ]),
    ]);
  }

  function step(n, iconName, title, help, tiles, cls) {
    return el('div', { class: 'tr-step' }, [
      el('div', { class: 'tr-step-head' }, [
        el('span', { class: 'tr-step-num', text: String(n) }),
        el('div', {}, [el('h3', { class: 'tr-step-title' }, [icon(iconName), ' ' + title]), el('p', { class: 'tr-step-help', text: help })]),
      ]),
      el('div', { class: 'tr-tiles ' + (cls || ''), role: 'group', 'aria-label': title }, tiles),
    ]);
  }
  // the Wildlife or Trekking shortcut is on when it is the only interest and no area is picked
  function themeOf() {
    if (state.areas.length || state.must || state.interests.length !== 1) return null;
    return THEMES.some(function (t) { return t.cat === state.interests[0]; }) ? state.interests[0] : null;
  }
  function summaryText() {
    var area = state.must ? 'Must-see highlights' : state.areas.length ? state.areas.map(function (k) { return areaInfo(k).label; }).join(', ') : 'All of Wayanad';
    var ints = state.interests.length ? state.interests.map(function (k) {
      var c = categories.filter(function (x) { return x.key === k; })[0];
      return c ? c.name : k;
    }).join(', ') : 'Everything';
    var pace = PACES.filter(function (x) { return x.key === state.pace; })[0];
    return [state.days + ' days', area, ints, (pace ? pace.label : state.pace) + ' pace'];
  }

  function controls() {
    var body = el('div');
    body.appendChild(el('p', { class: 'tr-planner-intro', text: 'Choose in the four steps below; your trail further down changes as soon as you tap. Every day starts and ends at the villa in Kalpetta.' }));
    var steps = el('div', { class: 'tr-steps' });
    steps.appendChild(step(1, 'fa-calendar-alt', 'How many days do you have?', 'One day for each part of Wayanad.',
      DAYS.map(function (d) { return tile({ big: String(d.key), label: d.key + ' days', sub: d.sub }, state.days === d.key, function () { state.days = d.key; update(); }); })));
    var theme = themeOf();
    var areaTile = function (a) {
      return tile({ icon: 'fa-map-marker-alt', label: a.label, sub: a.side }, state.areas.indexOf(a.key) >= 0, function () { state.must = false; toggle(state.areas, a.key); update(); });
    };
    var areaStep = step(2, 'fa-map-marked-alt', 'Which part of Wayanad?', '"All of Wayanad" gives one area a day; "Must-see highlights" fits the must-see places into the fewest days first; "Wildlife", "Trekking" and "Viewpoints" plan only those places; or pick areas.',
      [tile({ icon: 'fa-globe-asia', label: 'All of Wayanad', sub: 'Every area' }, !state.areas.length && !state.must && !theme, function () { state.areas = []; state.must = false; if (themeOf()) state.interests = []; update(); }),
        tile({ icon: 'fa-star', label: 'Must-see highlights', sub: 'Top ' + places.filter(function (p) { return p.must; }).length + ' places first' }, state.must, function () { state.areas = []; state.must = true; update(); }),
        areaTile(areaInfo('c'))].concat(
        THEMES.filter(function (t) { return places.some(function (p) { return p.cat === t.cat; }); }).map(function (t) {
          return tile({ icon: t.icon, label: t.label, sub: t.sub }, theme === t.cat, function () { state.areas = []; state.must = false; state.interests = [t.cat]; update(); });
        })), 'tr-tiles-areas');
    areaStep.appendChild(el('div', { class: 'tr-tiles tr-tiles-compass', role: 'group', 'aria-label': 'North, East, West or South of Kalpetta' },
      COMPASS.map(function (k) { return areaTile(areaInfo(k)); })));
    steps.appendChild(areaStep);
    steps.appendChild(step(3, 'fa-heart', 'What do you enjoy?', 'Leave "Everything" on, or pick as many as you like.',
      [tile({ icon: 'fa-th-large', label: 'Everything', sub: places.length + ' places' }, !state.interests.length, function () { state.interests = []; update(); })].concat(
        categories.map(function (c) { return tile({ icon: c.icon, img: c.img, label: c.short, sub: c.count + (c.count === 1 ? ' place' : ' places') }, state.interests.indexOf(c.key) >= 0, function () { toggle(state.interests, c.key); update(); }); }))));
    steps.appendChild(step(4, 'fa-tachometer-alt', 'How full should each day be?', 'Each day is planned for about 9 hours, driving included.',
      PACES.map(function (x) { return tile({ icon: x.icon, label: x.label, sub: x.sub }, state.pace === x.key, function () { state.pace = x.key; update(); }); })));
    body.appendChild(steps);

    var excluded = store('bwTrailsExcluded') || [];
    var sum = summaryText();
    body.appendChild(el('div', { class: 'tr-summary' }, [
      el('p', { class: 'tr-summary-text' }, [icon('fa-route'), ' Your trail: '].concat(sum.map(function (t, k) {
        return el('strong', { text: t + (k < sum.length - 1 ? ' · ' : '') });
      }))),
      el('div', { class: 'tr-actions' }, [
        el('button', { type: 'button', class: 'tr-btn', onclick: scrollToDays }, [icon('fa-arrow-down'), ' See my trail']),
        el('button', { type: 'button', class: 'tr-btn is-ghost', onclick: copyLink }, [icon('fa-link'), ' Copy link']),
        el('button', { type: 'button', class: 'tr-btn is-ghost', onclick: printTrail }, [icon('fa-print'), ' Print / PDF']),
        excluded.length ? el('button', {
          type: 'button', class: 'tr-btn is-ghost', text: 'Bring back ' + excluded.length + ' skipped place' + (excluded.length > 1 ? 's' : ''),
          onclick: function () { store('bwTrailsExcluded', []); update(); },
        }) : null,
      ]),
      el('p', { class: 'tr-note', id: 'tr-copy-note', 'aria-live': 'polite' }),
    ]));
    return portlet('tr-plan', 'Build your own trail', '4 quick choices', body);
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
    // the place to eat that adds the least driving between this stop and the next one (or the villa),
    // within 10 km of the stop; straight line x 1.4 for the detour, as places to eat are not in the road matrix
    var next = stops[at + 1] || BASE;
    var direct = straightKm(stops[at], next);
    var near = null;
    food.forEach(function (f) {
      var km = straightKm(stops[at], f);
      if (km > 10) return;
      var detour = (km + straightKm(f, next) - direct) * 1.4;
      var rank = LUNCH_KINDS.indexOf(f.kind) >= 0 ? LUNCH_KINDS.indexOf(f.kind) : LUNCH_KINDS.length;
      var score = detour + rank * 1.5;   // a restaurant 1.5 km more out of the way beats a cafe
      if (!near || score < near.score) near = { f: f, km: km, score: score };
    });
    return { at: at, place: near && near.f, km: near && near.km };
  }
  function lunchRow(day, i, lunch, leg) {
    var id = 'tr-lunch-' + (i + 1);
    var stop = day.stops[lunch.at];
    var f = lunch.place;
    var meta = [];
    if (f) {
      meta.push(String(f.kind || '').replace('shop:', '').replace('_', ' '));
      if (f.cuisine && f.cuisine.length) meta.push(f.cuisine.join(', '));
      if (f.vegetarian === true || f.vegetarian === 'yes' || f.vegetarian === 'only') meta.push('vegetarian options');
      if (f.opening_hours) meta.push('open ' + f.opening_hours);
    }
    return stopRow({
      cls: 'tr-lunch', id: id,
      pic: el('div', { class: 'tr-stop-pic tr-lunch-pic', 'aria-hidden': 'true' }, [icon('fa-utensils')]),
      name: f ? el('a', { class: 'tr-stop-name', href: f.osm_url, target: '_blank', rel: 'noopener', text: f.name || 'Place to eat' }) : el('span', { class: 'tr-stop-name', text: 'Lunch' }),
      pill: 'Lunch',
      metaIcon: 'fa-utensils',
      meta: f ? meta.join(' · ') : 'No place to eat is listed within 10 km of ' + stop.name + ' on OpenStreetMap: carry lunch or eat in the nearest town.',
      leg: f && leg ? leg : null,
      dir: f ? dirLink(f, f.name || 'the lunch stop') : null,
      remove: el('button', {
        type: 'button', class: 'tr-portlet-btn tr-stop-x', title: 'Remove the lunch stop', 'aria-label': 'Remove the lunch stop from day ' + (i + 1), text: '×',
        onclick: function () { hidden.push(id); store('bwTrailsHidden', hidden); render(); },
      }),
    });
  }
  // one layout for every row of a day: photo (with the stop number) | name, type and time, distance | Go and x
  function stopRow(r) {
    return el('li', r.id ? { class: 'tr-stop' + (r.cls ? ' ' + r.cls : ''), id: r.id } : { class: 'tr-stop' + (r.cls ? ' ' + r.cls : '') }, [
      r.pic,
      el('div', { class: 'tr-stop-main' }, [
        el('div', { class: 'tr-stop-title' }, [r.name, r.pill ? el('span', { class: 'tr-pill', text: r.pill }) : null]),
        el('span', { class: 'tr-stop-meta' }, [icon(r.metaIcon), el('span', { text: r.meta })]),
        r.leg ? el('span', { class: 'tr-leg' }, [icon('fa-car-side'), el('span', { id: r.leg.id, text: r.leg.text })]) : null,
      ]),
      el('div', { class: 'tr-stop-tools' }, [r.dir, r.remove]),
    ]);
  }


  // the day's drive: the villa, the stops in order with the lunch place after its stop, the villa again;
  // each waypoint after the first has a leg (distance from the one before), shown in the list and the map
  function dayWaypoints(day, i) {
    var lunch = hidden.indexOf('tr-lunch-' + (i + 1)) < 0 ? lunchFor(day.stops) : null;
    var w = [{ pt: BASE, name: 'the villa' }];
    day.stops.forEach(function (p, j) {
      w.push({ pt: p, name: p.name, stop: j, prefix: '' });
      if (lunch && lunch.at === j && lunch.place) w.push({ pt: lunch.place, name: lunch.place.name || 'the lunch stop', lunch: true, prefix: '' });
    });
    if (day.stops.length) w.push({ pt: BASE, name: 'the villa', end: true, prefix: 'Back to the villa: ' });
    return { w: w, lunch: lunch };
  }
  function legText(w, k, roadKmByOsrm) {
    var from = w[k - 1], to = w[k];
    if (roadKmByOsrm != null) return to.prefix + 'about ' + roadKmByOsrm + ' km by road from ' + from.name;
    return to.prefix + 'about ' + roadKm(from.pt, to.pt) + ' km from ' + from.name + (knownKm(from.pt, to.pt) ? '' : ' (estimate)');
  }

  function directionsUrl(pt) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + pt.lat.toFixed(6) + ',' + pt.lon.toFixed(6) + '&travelmode=driving';
  }
  // the whole day in Google Maps: from the villa, through every stop (and lunch) in order, back to the villa
  function dayDirectionsUrl(way) {
    var mid = way.slice(1, -1).map(function (x) { return x.pt.lat.toFixed(6) + ',' + x.pt.lon.toFixed(6); }).join('|');
    var b = BASE.lat.toFixed(6) + ',' + BASE.lon.toFixed(6);
    return 'https://www.google.com/maps/dir/?api=1&origin=' + b + '&destination=' + b + (mid ? '&waypoints=' + encodeURIComponent(mid) : '') + '&travelmode=driving';
  }
  function dirLink(pt, name) {
    return el('a', { class: 'tr-dir', href: directionsUrl(pt), target: '_blank', rel: 'noopener nofollow', title: 'Directions to ' + name, 'aria-label': 'Directions to ' + name }, [icon('fa-directions'), el('span', { text: 'Go' })]);
  }

  function dayPortlet(day, i) {
    var st = dayStats(day.stops);
    var a = dayArea(day);
    var list = el('ol', { class: 'tr-stops' });
    var prev = BASE;
    var way = dayWaypoints(day, i);
    var lunch = way.lunch;
    var legAt = {};
    way.w.forEach(function (x, k) { if (k) legAt[x.lunch ? 'lunch' : x.end ? 'end' : x.stop] = k; });
    day.stops.forEach(function (p, j) {
      var item = siteItem(p.id) || {};
      var meta = [p.label, 'about ' + fmtH(hoursAt(p)) + ' there'];
      if (Array.isArray(item.timing) && item.timing.length) meta.push('open ' + item.timing.join(', '));
      if (item.holidays && !/^(na|none|-)$/i.test(item.holidays)) meta.push('closed ' + item.holidays);
      list.appendChild(stopRow({
        pic: el('div', { class: 'tr-stop-pic' }, [
          el('img', { src: p.img, alt: '', loading: 'lazy', decoding: 'async', width: '72', height: '54' }),
          el('span', { class: 'tr-stop-num', style: 'background:' + COLORS[i % COLORS.length], text: String(j + 1) }),
        ]),
        name: el('a', { class: 'tr-stop-name', href: p.url, text: p.name }),
        pill: p.must ? 'Must-see' : null,
        metaIcon: catIcon(p.cat),
        meta: meta.join(' · '),
        leg: { id: 'tr-leg-' + i + '-' + legAt[j], text: legText(way.w, legAt[j]) },
        dir: dirLink(p, p.name),
        remove: el('button', {
          type: 'button', class: 'tr-portlet-btn tr-stop-x', title: 'Remove this stop', 'aria-label': 'Remove ' + p.name + ' from day ' + (i + 1), text: '×',
          onclick: function () { removedStops.push({ day: i, place: p, index: j }); day.stops.splice(j, 1); render(); },
        }),
      }));
      if (lunch && lunch.at === j) list.appendChild(lunchRow(day, i, lunch, legAt.lunch ? { id: 'tr-leg-' + i + '-' + legAt.lunch, text: legText(way.w, legAt.lunch) } : null));
      prev = p;
    });
    var body = el('div', { class: 'tr-day-body' }, [
      day.stops.length ? list : el('p', { class: 'tr-empty', text: 'No stops left for this day.' }),
      day.stops.length ? el('p', { class: 'tr-day-foot' }, [
        el('span', { id: 'tr-leg-' + i + '-' + legAt.end, text: legText(way.w, legAt.end) }),
        '. Road km; times are estimates.',
      ]) : null,
      day.stops.length ? el('a', { class: 'tr-btn tr-day-nav', href: dayDirectionsUrl(way.w), target: '_blank', rel: 'noopener nofollow' },
        [icon('fa-route'), ' Open day ' + (i + 1) + ' in Google Maps']) : null,
    ]);
    var badge = el('span', { class: 'tr-day-badge', style: 'background:' + COLORS[i % COLORS.length], text: String(i + 1) });
    var sub = a.label + ' (' + a.towns + ') · ' + day.stops.length + ' stops · about ' + st.km + ' km, ' + fmtH(st.drive) + ' driving, ' + fmtH(st.total) + ' in all';
    var box = portlet('tr-day-' + (i + 1), 'Day ' + (i + 1), sub, body, { badge: badge });
    box.classList.add('tr-day');
    return box;
  }

  function mapPortlet() {
    var body = el('div', {}, [
      el('div', { class: 'tr-map', id: 'tr-map', role: 'region', 'aria-label': 'Map of the trail' }),
      el('div', { class: 'tr-legend' }, plan.map(function (d, i) {
        return el('span', {}, [el('i', { style: 'background:' + COLORS[i % COLORS.length] }), 'Day ' + (i + 1) + ' ',
          el('small', { class: 'tr-route-km', id: 'tr-route-' + (i + 1) })]);
      })),
      el('p', { class: 'tr-note', text: 'The lines are the driving routes (OSRM on OpenStreetMap data). Tap a pin for directions. Map data © OpenStreetMap contributors.' }),
    ]);
    return portlet('tr-map-box', 'Trail map', 'Numbered stops, one colour per day', body);
  }

  function tipsPortlet() {
    var ul = el('ul', { class: 'tr-tips' });
    [
      'Opening hours and weekly holidays are shown where the place page has them; check the place page before you go, as they change.',
      'Driving times are estimates at about ' + KMH + ' km/h on hill roads; leave early on days with more than 80 km.',
      'Tap "Go" next to a place for directions from where you are, or "Open day in Google Maps" for the whole day in order.',
      'Use × on a stop to skip it, or on any box to hide it. Hidden boxes come back from the bar at the top.',
      'Lunch is the nearest place to eat on OpenStreetMap to the stop you reach around midday; check that it is open. Missing hours or places can be added on OpenStreetMap.',
      'Copy the link to share the trail; it opens with the same days, areas, interests and pace.',
    ].forEach(function (t) { ul.appendChild(el('li', { text: t })); });
    return portlet('tr-tips', 'Good to know', '', ul);
  }

  function hiddenBar() {
    var labels = { 'tr-plan': 'Plan your trail', 'tr-map-box': 'Trail map', 'tr-tips': 'Good to know' };
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

  // why the trail has fewer days than chosen, and the choices that would give more
  function shortfall() {
    var excluded = store('bwTrailsExcluded') || [];
    var fixes = [];
    if (state.interests.length) fixes.push(el('button', { type: 'button', class: 'tr-btn', onclick: function () { state.interests = []; update(); } }, [icon('fa-th-large'), ' Use all interests']));
    if (state.areas.length) fixes.push(el('button', { type: 'button', class: 'tr-btn', onclick: function () { state.areas = []; update(); } }, [icon('fa-globe-asia'), ' Use all of Wayanad']));
    if (excluded.length) fixes.push(el('button', { type: 'button', class: 'tr-btn', onclick: function () { store('bwTrailsExcluded', []); update(); } }, [icon('fa-undo'), ' Bring back ' + excluded.length + ' skipped place' + (excluded.length > 1 ? 's' : '')]));
    var why = plan.length
      ? 'Your choices have enough places for ' + plan.length + ' of the ' + state.days + ' days you picked.'
      : 'No places match these choices.';
    return el('div', { class: 'tr-shortfall', role: 'status' }, [
      el('p', {}, [icon('fa-info-circle'), ' ' + why + (fixes.length ? ' For more days:' : ' Pick fewer days.')]),
      fixes.length ? el('div', { class: 'tr-actions' }, fixes) : null,
    ]);
  }

  // ------------------------------------------------------------ render
  function render() {
    root.innerHTML = '';
    root.appendChild(hiddenBar());
    root.appendChild(controls());
    var days = el('div', { class: 'tr-days', id: 'tr-days' });
    if (!plan.length) {
      days.appendChild(el('p', { class: 'tr-empty', text: 'No places match these choices. Add an area or an interest, or bring back skipped places.' }));
    }
    if (plan.length < state.days) root.appendChild(shortfall());
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
      var way = dayWaypoints(d, i).w;
      var line = way.map(function (x) { return [x.pt.lat, x.pt.lon]; });
      way.forEach(function (x) {
        if (!x.lunch) return;
        L.marker([x.pt.lat, x.pt.lon], { title: 'Day ' + (i + 1) + ': lunch at ' + x.name,
          icon: L.divIcon({ className: '', html: '<div class="tr-num tr-num-lunch" style="background:' + color + '"><i class="fas fa-utensils"></i></div>', iconSize: [24, 24], iconAnchor: [12, 12] }) })
          .addTo(map).bindPopup('<strong>Day ' + (i + 1) + ', lunch</strong><br>' + x.name + '<br>' +
            '<a target="_blank" rel="noopener nofollow" href="' + directionsUrl(x.pt) + '">Directions</a>');
        bounds.push([x.pt.lat, x.pt.lon]);
      });
      d.stops.forEach(function (p, j) {
        var icon = L.divIcon({ className: '', html: '<div class="tr-num" style="background:' + color + '">' + (j + 1) + '</div>', iconSize: [24, 24], iconAnchor: [12, 12] });
        L.marker([p.lat, p.lon], { icon: icon, title: 'Day ' + (i + 1) + ': ' + p.name }).addTo(map)
          .bindPopup('<strong>Day ' + (i + 1) + ', stop ' + (j + 1) + '</strong><br><a href="' + p.url + '">' + p.name + '</a><br>' +
            '<a target="_blank" rel="noopener nofollow" href="' + directionsUrl(p) + '">Directions</a>');
        bounds.push([p.lat, p.lon]);
      });
      routeQueue.push({ day: i, pts: line, way: way, color: color, visit: dayStats(d.stops).visit, area: dayArea(d), stops: d.stops.length });
      var note = document.getElementById('tr-route-' + (i + 1));
      if (note) note.textContent = 'loading the road route…';
    });
    map.fitBounds(bounds, { padding: [25, 25], maxZoom: 12 });
    loadRoutes(routeQueue, mapGen);
  }

  // road routes, one day at a time and at most one request a second (the public OSRM server's limit)
  function routeKey(pts) { return 'bwRoute2:' + pts.map(function (p) { return p[0].toFixed(4) + ',' + p[1].toFixed(4); }).join(';'); }
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
          legs: (r.legs || []).map(function (l) { return Math.round(l.distance / 1000); }),
          line: r.geometry.coordinates.map(function (c) { return [Math.round(c[1] * 1e5) / 1e5, Math.round(c[0] * 1e5) / 1e5]; }) };
        store(routeKey(job.pts), route);
        drawRoute(job, route, gen);
      }
      else routeFailed(job);
    }).catch(function () { routeFailed(job); }).then(function () {
      setTimeout(function () { loadRoutes(queue, gen); }, 1100);
    });
  }
  function routeFailed(job) {
    var note = document.getElementById('tr-route-' + (job.day + 1));
    if (note) note.textContent = 'road route not available now: use "Open day ' + (job.day + 1) + ' in Google Maps"';
  }
  function drawRoute(job, route, gen) {
    if (gen !== mapGen || !map) return;
    L.polyline(route.line, { color: '#000', weight: 7, opacity: 0.35 }).addTo(map);
    L.polyline(route.line, { color: job.color, weight: 4, opacity: 0.95 }).addTo(map)
      .bindTooltip('Day ' + (job.day + 1) + ': road route about ' + route.km + ' km, ' + fmtH(route.h) + ' driving (OSRM)', { sticky: true });
    var note = document.getElementById('tr-route-' + (job.day + 1));
    if (note) note.textContent = 'road route about ' + route.km + ' km';
    // the list and the day's summary take the road route's numbers
    (route.legs || []).forEach(function (km, k) {
      var span = document.getElementById('tr-leg-' + job.day + '-' + (k + 1));
      if (span && job.way[k + 1]) span.textContent = legText(job.way, k + 1, km);
    });
    var sub = document.querySelector('#tr-day-' + (job.day + 1) + ' .tr-portlet-sub');
    if (sub) sub.textContent = job.area.label + ' (' + job.area.towns + ') · ' + job.stops + ' stops · about ' + route.km + ' km by road, ' +
      fmtH(route.h) + ' driving, ' + fmtH(route.h + job.visit) + ' in all';
  }

  // ------------------------------------------------------------ print
  function printHead() {
    var names = function (list, all) { return list.length ? list.join(', ') : all; };
    var areas = state.must ? 'must-see highlights' : names(state.areas.map(function (k) { return areaInfo(k).label; }), 'all areas');
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
    if (state.must) q.set('focus', 'highlights');
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
    state.must = q.get('focus') === 'highlights' && !state.areas.length;
  }
  function update() {
    hidden = hidden.filter(function (id) { return !/^tr-(day|lunch)-/.test(id); });
    store('bwTrailsHidden', hidden);
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
      // label, icon and photo of each type of place come from data/categories.js (through map-places.json)
      categories = (data.categories || []).map(function (c) { return { key: c.key, name: c.label, short: c.short || c.label, count: c.count, icon: c.icon || 'fa-map-marker-alt', img: c.img, label: c.label + ' (' + c.count + ')' }; });
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
