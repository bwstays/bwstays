// In-site search for search.html. Reads data/search-index.json (built by
// scripts/build-search-index.mjs), so it works on free static hosting with no
// server or third-party service.
(function () {
  var input = document.getElementById('site-search-input');
  var out = document.getElementById('site-search-results');
  var status = document.getElementById('site-search-status');
  var chips = document.querySelectorAll('[data-search-type]');
  if (!input || !out) return;

  var items = [];
  var type = 'all';
  var LIMIT = 40;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9ഀ-ൿ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function safeUrl(u) {
    return /^https?:\/\//i.test(u || '') ? u : '#';
  }
  function score(item, words) {
    var name = item._n;
    var all = item._a;
    var total = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (all.indexOf(w) === -1) return 0;           // every word must match somewhere
      if (name === w) total += 12;
      else if (name.indexOf(w) === 0) total += 8;
      else if (name.indexOf(w) > -1) total += 5;
      else total += 1;
    }
    if (item.t === 'place') total += 1;
    if (item.km != null) total += Math.max(0, 1 - item.km / 100);
    return total;
  }
  function label(t) {
    return { place: 'Place', food: 'Food', faq: 'FAQ', page: 'Page' }[t] || t;
  }
  function card(item) {
    var meta = [];
    if (item.km != null) meta.push(item.km + ' km by road');
    if (item.r != null) meta.push('rating ' + item.r);
    if (item.h) meta.push(item.h);
    var sub = item.t === 'faq' ? item.s.slice(0, 220) + (item.s.length > 220 ? '...' : '') : item.s;
    var link = item.u
      ? '<a class="stretched-link text-white" href="' + esc(safeUrl(item.u)) + '"' +
        (/^https:\/\/www\.bwstays\.com\//.test(item.u) ? '' : ' target="_blank" rel="noopener noreferrer nofollow"') + '>' +
        esc(item.n) + '</a>'
      : esc(item.n);
    return '<div class="col-md-6 mb-3"><div class="card bg-dark text-white-50 h-100 position-relative"><div class="card-body">' +
      '<span class="badge badge-primary mb-2">' + esc(label(item.t)) + '</span>' +
      '<h2 class="h6 text-white mb-1">' + link + '</h2>' +
      '<p class="small mb-1">' + esc(sub) + '</p>' +
      (meta.length ? '<p class="small mb-0"><i class="fas fa-route text-primary mr-1"></i>' + esc(meta.join(' - ')) + '</p>' : '') +
      '</div></div></div>';
  }
  function run() {
    var q = norm(input.value);
    var words = q ? q.split(' ') : [];
    var pool = items.filter(function (it) { return type === 'all' || it.t === type; });
    var hits;
    if (!words.length) {
      hits = pool.filter(function (it) { return it.t === 'place' || it.t === 'page'; }).slice(0, 12);
      status.textContent = 'Popular places and pages. Type to search ' + items.length + ' places, restaurants and answers.';
    } else {
      hits = pool.map(function (it) { return { it: it, s: score(it, words) }; })
        .filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, LIMIT)
        .map(function (x) { return x.it; });
      status.textContent = hits.length ? hits.length + ' result' + (hits.length > 1 ? 's' : '') : 'No results for "' + input.value + '". Try a place name, "vegetarian" or "waterfall".';
    }
    out.innerHTML = hits.map(card).join('');
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      type = c.getAttribute('data-search-type');
      chips.forEach(function (x) { x.classList.toggle('active', x === c); });
      run();
    });
  });
  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  });
  var params = new URLSearchParams(location.search);
  if (params.get('q')) input.value = params.get('q');

  fetch('https://www.bwstays.com/data/search-index.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      items = d.items.map(function (it) {
        it._n = norm(it.n);
        it._a = norm([it.n, it.s, it.k].join(' '));
        return it;
      });
      run();
    })
    .catch(function () {
      status.textContent = 'Search is unavailable right now. Please use the menu to browse places.';
    });
})();
