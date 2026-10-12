// footer.html (terms page): links across the site point at
// footer.html#tc, #disclaimer, #privacy and #cookies. Those names are also used
// by links in the page footer, so the sections have their own ids; this routes
// the old hash names to the right card, opens it and scrolls to it.
(function () {
  var TARGETS = {
    tc: 'section-tc',
    terms: 'section-tc',
    responsibility: 'section-responsibility',
    disclaimer: 'section-disclaimer',
    copyright: 'section-disclaimer',
    privacy: 'section-privacy',
    cookies: 'section-privacy'
  };

  function go() {
    var name = decodeURIComponent(location.hash.replace(/^#/, '')).toLowerCase();
    var id = TARGETS[name];
    var card = id && document.getElementById(id);
    if (!card) {
      return;
    }
    var details = card.querySelector('details');
    if (details) {
      details.open = true;
    }
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.addEventListener('hashchange', go);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go);
  } else {
    go();
  }
})();
