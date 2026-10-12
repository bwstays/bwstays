// In-site search for search.html. Reads data/search-index.json (built by
// scripts/build-search-index.mjs), so it works on free static hosting with no
// server or third-party service.
//
// Ranking: every query word must match (typos of one letter are tolerated and a
// small synonym list widens common words); name matches outweigh category and
// keyword matches. If nothing matches every word, the best partial matches are
// shown and labelled. Results are paginated and the state lives in the URL.
(function () {
  var input = document.getElementById('site-search-input');
  var out = document.getElementById('site-search-results');
  var status = document.getElementById('site-search-status');
  var pager = document.getElementById('site-search-pages');
  var sortSel = document.getElementById('site-search-sort');
  var tabs = document.querySelectorAll('[data-search-type]');
  if (!input || !out) return;

  var PAGE_SIZE = 8;
  var items = [];
  var state = { q: '', type: 'all', sort: 'relevance', page: 1 };

  // ---------------------------------------------------------------- text helpers
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) {
    var t = String(s || '').toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return t.replace(/&/g, ' and ').replace(/[^a-z0-9ഀ-ൿ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function safeUrl(u) {
    return /^https?:\/\//i.test(u || '') ? u : '#';
  }
  function lev1(a, b) { // true when the edit distance is at most 1
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, edits = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
    }
    return edits + (la - i) + (lb - j) <= 1;
  }

  // common words people type -> words that actually appear in the data
  var SYN = {
    falls: ['waterfall', 'waterfalls'], fall: ['waterfall'], waterfalls: ['waterfall', 'falls'], waterfall: ['falls'],
    cascade: ['waterfall'], veg: ['vegetarian'], vegan: ['vegetarian'], vegetarian: ['veg'],
    eat: ['restaurant', 'food'], dine: ['restaurant'], dining: ['restaurant'], hotel: ['restaurant'], lunch: ['restaurant'],
    dinner: ['restaurant'], breakfast: ['restaurant', 'cafe'], coffee: ['cafe'], tea: ['cafe', 'plantation'],
    snack: ['bakery', 'fast'], sweets: ['bakery', 'confectionery'], cake: ['bakery'],
    temple: ['pilgrimage', 'shrine'], church: ['pilgrimage'], mosque: ['pilgrimage'], shrine: ['pilgrimage', 'temple'],
    trek: ['trekking'], hike: ['trekking'], hiking: ['trekking'], trail: ['trekking'], peak: ['trekking'],
    view: ['viewpoint', 'romantic'], viewpoint: ['romantic', 'view'], sunset: ['viewpoint'], honeymoon: ['romantic'],
    safari: ['wildlife'], animal: ['wildlife'], animals: ['wildlife'], elephant: ['wildlife'], bird: ['wildlife'], birds: ['wildlife'],
    stay: ['villa', 'booking'], room: ['villa'], rooms: ['villa'], book: ['booking', 'reservation'], reserve: ['booking'],
    price: ['rate', 'night'], cost: ['rate', 'night'], cheap: ['rate'], tariff: ['rate'],
    pet: ['pets'], dog: ['pets'], zipline: ['adventure', 'sporting'], rafting: ['adventure', 'sporting'],
    museum: ['museums'], lake: ['dam'], dam: ['lake'], cycle: ['cycling'], bike: ['cycling'],
    contact: ['phone', 'email'], terms: ['policies', 'privacy'], privacy: ['policies']
  };
  function variants(word) {
    var set = {};
    set[word] = 1;
    (SYN[word] || []).forEach(function (w) { set[w] = 1; });
    return Object.keys(set);
  }

  // how well a single query term matches one token: 0 (no) .. 1 (exact)
  function tokenScore(term, tok) {
    if (tok === term) return 1;
    if (term.length >= 2 && tok.indexOf(term) === 0) return 0.8;
    if (term.length >= 4 && tok.indexOf(term) > -1) return 0.5;
    if (term.length >= 5 && tok.length >= 5 && lev1(term, tok)) return 0.6;
    return 0;
  }
  function fieldScore(terms, toks) {
    var best = 0;
    for (var a = 0; a < terms.length; a++) {
      for (var b = 0; b < toks.length; b++) {
        var s = tokenScore(terms[a], toks[b]);
        if (s > best) best = s;
        if (best === 1) return 1;
      }
    }
    return best;
  }

  var STOP = {};
  ('a an the in on at of to for and or is are was be do does can i me my we our you your with from by near about what where how when which ' +
   'there any some please show find get').split(' ').forEach(function (w) { STOP[w] = 1; });

  var W_NAME = 10, W_SUB = 4, W_KEY = 3;
  function scoreItem(it, qWords, qNorm) {
    var matched = 0;
    var total = 0;
    for (var i = 0; i < qWords.length; i++) {
      var terms = variants(qWords[i]);
      var sName = fieldScore(terms, it._nameToks);
      var sSub = fieldScore(terms, it._subToks);
      var sKey = fieldScore(terms, it._keyToks);
      var w = Math.max(sName * W_NAME, sSub * (it.t === 'faq' ? 1.5 : W_SUB), sKey * W_KEY);
      if (w > 0) { matched++; total += w; }
    }
    if (!matched) return { matched: 0, score: 0 };
    if (qNorm && it._name.indexOf(qNorm) === 0) total += 10;
    else if (qNorm && it._name.indexOf(qNorm) > -1) total += 6;
    if (it.t === 'place' || it.t === 'page') total += 0.5;
    if (it.t === 'faq') total *= 0.85;
    if (it.km != null) total *= 1 + Math.max(0, 30 - it.km) / 400;   // closer places edge ahead
    if (it.r != null) total *= 1 + it.r / 100;                        // so do well-rated ones
    return { matched: matched, score: total };
  }

  // ---------------------------------------------------------------- searching
  var TYPE_ORDER = { page: 0, place: 1, food: 2, faq: 3 };
  function search() {
    var qNorm = norm(state.q);
    var words = qNorm ? qNorm.split(' ') : [];
    // filler words match inside unrelated words ("in" in "indian"), so they are ignored
    var meaningful = words.filter(function (w) { return !STOP[w]; });
    if (meaningful.length) words = meaningful;
    var all = [];
    var partial = false;
    if (!words.length) {
      all = items.map(function (it) { return { it: it, s: 0, m: 0 }; });
    } else {
      var strict = [], loose = [];
      items.forEach(function (it) {
        var r = scoreItem(it, words, qNorm);
        if (!r.matched) return;
        var rec = { it: it, s: r.score, m: r.matched };
        if (r.matched === words.length) strict.push(rec); else loose.push(rec);
      });
      if (strict.length) all = strict;
      else if (words.length > 1) { all = loose; partial = true; }
    }
    return { all: all, partial: partial, words: words };
  }
  function byType(list, type) {
    return type === 'all' ? list : list.filter(function (r) { return r.it.t === type; });
  }
  function sortList(list, hasQuery) {
    var s = state.sort;
    var cmp;
    if (s === 'distance') {
      cmp = function (a, b) {
        var ak = a.it.km == null ? 1e9 : a.it.km, bk = b.it.km == null ? 1e9 : b.it.km;
        return ak - bk || b.s - a.s;
      };
    } else if (s === 'name') {
      cmp = function (a, b) { return a.it._name < b.it._name ? -1 : a.it._name > b.it._name ? 1 : 0; };
    } else if (hasQuery) {
      cmp = function (a, b) { return b.m - a.m || b.s - a.s || a.it._name.localeCompare(b.it._name); };
    } else { // browsing: pages first, then nearest places / food, then questions
      cmp = function (a, b) {
        var ta = TYPE_ORDER[a.it.t], tb = TYPE_ORDER[b.it.t];
        if (ta !== tb) return ta - tb;
        var ak = a.it.km == null ? 1e9 : a.it.km, bk = b.it.km == null ? 1e9 : b.it.km;
        return ak - bk || a.it._name.localeCompare(b.it._name);
      };
    }
    return list.slice().sort(cmp);
  }

  // ---------------------------------------------------------------- rendering
  var LABEL = { place: 'Place', food: 'Food', faq: 'FAQ', page: 'Page' };
  function highlighter(words) {
    var terms = [];
    words.forEach(function (w) { variants(w).forEach(function (t) { if (t.length >= 2 && terms.indexOf(t) < 0) terms.push(t); }); });
    if (!terms.length) return function (t) { return esc(t); };
    terms.sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp('(' + terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'ig');
    return function (text) {
      return String(text).split(re).map(function (part, i) { return i % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part); }).join('');
    };
  }
  function card(it, hl) {
    var meta = [];
    if (it.km != null) meta.push(it.km + ' km by road');
    if (it.r != null) meta.push('rating ' + it.r);
    if (it.h) meta.push(it.h);
    var sub = it.t === 'faq' ? it.s.slice(0, 200) + (it.s.length > 200 ? '…' : '') : it.s;
    var ext = it.u && !/^https:\/\/www\.bwstays\.com\//.test(it.u);
    var title = hl(it.n);
    var head = it.u
      ? '<a class="stretched-link" href="' + esc(safeUrl(it.u)) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer nofollow"' : '') + '>' + title + '</a>'
      : title;
    return '<div class="col-md-6 mb-3"><article class="bw-result bw-result-' + it.t + '">' +
      '<span class="bw-result-badge">' + esc(LABEL[it.t] || it.t) + '</span>' +
      '<h2 class="bw-result-title">' + head + '</h2>' +
      (sub ? '<p class="bw-result-sub">' + hl(sub) + '</p>' : '') +
      (meta.length ? '<p class="bw-result-meta"><i class="fas fa-route" aria-hidden="true"></i> ' + esc(meta.join(' · ')) + '</p>' : '') +
      '</article></div>';
  }
  function pageButtons(pages, current) {
    var show = {};
    [1, pages, current - 1, current, current + 1].forEach(function (p) { if (p >= 1 && p <= pages) show[p] = 1; });
    var nums = Object.keys(show).map(Number).sort(function (a, b) { return a - b; });
    var html = '<button type="button" class="bw-page-btn" data-page="' + (current - 1) + '"' + (current <= 1 ? ' disabled' : '') + ' aria-label="Previous page">&lsaquo; Prev</button>';
    var prev = 0;
    nums.forEach(function (p) {
      if (prev && p > prev + 1) html += '<span class="bw-page-gap" aria-hidden="true">…</span>';
      html += '<button type="button" class="bw-page-btn' + (p === current ? ' is-on' : '') + '" data-page="' + p + '"' +
        (p === current ? ' aria-current="page"' : '') + ' aria-label="Page ' + p + '">' + p + '</button>';
      prev = p;
    });
    html += '<button type="button" class="bw-page-btn" data-page="' + (current + 1) + '"' + (current >= pages ? ' disabled' : '') + ' aria-label="Next page">Next &rsaquo;</button>';
    return html;
  }

  function syncUrl() {
    if (!window.history || !history.replaceState) return;
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.type !== 'all') p.set('type', state.type);
    if (state.sort !== 'relevance') p.set('sort', state.sort);
    if (state.page > 1) p.set('page', state.page);
    var qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch (e) { /* ignore */ }
  }

  function render(scrollTop) {
    var res = search();
    var hasQuery = res.words.length > 0;
    // counts per type (ignoring the active type filter) go on the tabs
    var counts = { all: res.all.length, place: 0, food: 0, faq: 0, page: 0 };
    res.all.forEach(function (r) { counts[r.it.t]++; });
    Array.prototype.forEach.call(tabs, function (t) {
      var type = t.getAttribute('data-search-type');
      var on = type === state.type;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-pressed', on ? 'true' : 'false');
      var c = t.querySelector('.bw-count');
      if (c) c.textContent = counts[type];
    });
    var list = sortList(byType(res.all, state.type), hasQuery);
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
    var from = (state.page - 1) * PAGE_SIZE;
    var slice = list.slice(from, from + PAGE_SIZE);
    var hl = highlighter(res.words);
    out.innerHTML = slice.map(function (r) { return card(r.it, hl); }).join('');

    if (!list.length) {
      status.textContent = hasQuery
        ? 'No results for "' + state.q + '". Try a place name, "waterfall", "vegetarian" or "temple".'
        : 'Nothing to show for this filter.';
    } else {
      var shown = (from + 1) + '–' + (from + slice.length) + ' of ' + list.length;
      status.textContent = (hasQuery ? (res.partial ? 'Closest matches: ' : 'Results: ') : 'Browse: ') + shown +
        (res.partial ? ' (not every word matched)' : '');
    }
    if (pager) {
      pager.innerHTML = pages > 1 ? pageButtons(pages, state.page) : '';
      pager.style.display = pages > 1 ? '' : 'none';
    }
    syncUrl();
    if (scrollTop) {
      var top = out.getBoundingClientRect().top + window.pageYOffset - 140;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  // ---------------------------------------------------------------- wiring
  Array.prototype.forEach.call(tabs, function (t) {
    t.addEventListener('click', function () {
      state.type = t.getAttribute('data-search-type');
      state.page = 1;
      render(false);
    });
  });
  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      state.q = input.value.trim();
      state.page = 1;
      render(false);
    }, 140);
  });
  if (sortSel) {
    sortSel.addEventListener('change', function () {
      state.sort = sortSel.value;
      state.page = 1;
      render(false);
    });
  }
  if (pager) {
    pager.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-page]') : null;
      if (!b || b.disabled) return;
      state.page = Number(b.getAttribute('data-page'));
      render(true);
    });
  }

  var params = new URLSearchParams(location.search);
  state.q = (params.get('q') || '').trim();
  state.type = ['all', 'place', 'food', 'faq', 'page'].indexOf(params.get('type')) > -1 ? params.get('type') : 'all';
  state.sort = ['relevance', 'distance', 'name'].indexOf(params.get('sort')) > -1 ? params.get('sort') : 'relevance';
  state.page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  input.value = state.q;
  if (sortSel) sortSel.value = state.sort;

  fetch('https://www.bwstays.com/data/search-index.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      items = d.items.map(function (it) {
        it._name = norm(it.n);
        it._nameToks = it._name.split(' ');
        it._subToks = norm(it.s).split(' ');
        it._keyToks = norm(it.k || '').split(' ').filter(Boolean);
        return it;
      });
      render(false);
    })
    .catch(function () {
      status.textContent = 'Search is unavailable right now. Please use the menu to browse places.';
    });
})();
