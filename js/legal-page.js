// footer.html (terms page): links across the site point at
// footer.html#tc, #disclaimer, #privacy and #cookies. Those names are also used
// by links in the page footer, so the sections have their own ids; this routes
// the old hash names to the right card, opens it and scrolls to it.
(function () {
  var TARGETS = {
    tc: 'section-tc',
    terms: 'section-tc',
    cancellation: 'section-cancellation',
    cancellations: 'section-cancellation',
    refund: 'section-cancellation',
    refunds: 'section-cancellation',
    responsibility: 'section-responsibility',
    disclaimer: 'section-disclaimer',
    copyright: 'section-disclaimer',
    privacy: 'section-privacy',
    cookies: 'section-privacy',
    faq: 'section-faq',
    faqs: 'section-faq'
  };

  function openQuestion(name) {
    var item = /^faq-\d+$/.test(name) ? document.getElementById(name) : null;
    if (!item) {
      return false;
    }
    var card = document.getElementById('section-faq');
    var outer = card && card.querySelector('details');
    if (outer) {
      outer.open = true;
    }
    item.open = true;
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  }

  function go() {
    var name = decodeURIComponent(location.hash.replace(/^#/, '')).toLowerCase();
    if (openQuestion(name)) {
      return;
    }
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

  // FAQ card: expand all / collapse all
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.faq-expand-all, .faq-collapse-all') : null;
    if (!btn) {
      return;
    }
    var open = btn.classList.contains('faq-expand-all');
    document.querySelectorAll('#section-faq details.faq-qa').forEach(function (d) {
      d.open = open;
    });
  });

  window.addEventListener('hashchange', go);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go);
  } else {
    go();
  }
})();
