/*
 * The two Bootstrap behaviours the site uses, without the 84 KB Bootstrap JavaScript bundle:
 *
 *   1. collapse: the menu button ([data-toggle="collapse"][data-target]) opens and closes the menu, with the
 *      same classes and the same height transition as Bootstrap 4 (.collapse, .collapsing, .show, .collapsed,
 *      aria-expanded).
 *   2. scroll-spy: the menu link of the section being read gets .active (hash links of #mainNav only).
 *
 * Exposes window.bwNav.hideMenu() and window.bwNav.refreshSpy() for js/scripts.js.
 */
(function () {
  'use strict';

  // ------------------------------------------------------------------ collapse
  var DURATION = 350;

  function triggersFor(panel) {
    return document.querySelectorAll('[data-toggle="collapse"][data-target="#' + panel.id + '"]');
  }
  function setTriggers(panel, open) {
    Array.prototype.forEach.call(triggersFor(panel), function (t) {
      t.classList.toggle('collapsed', !open);
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  function finish(panel, open) {
    panel.classList.remove('collapsing');
    panel.classList.add('collapse');
    if (open) panel.classList.add('show');
    panel.style.height = '';
    panel._bwBusy = false;
  }
  function show(panel) {
    if (panel._bwBusy || panel.classList.contains('show')) return;
    panel._bwBusy = true;
    panel.classList.remove('collapse');
    panel.classList.add('collapsing');
    panel.style.height = '0px';
    setTriggers(panel, true);
    var size = panel.scrollHeight;
    panel.style.height = size + 'px';
    setTimeout(function () { finish(panel, true); }, DURATION);
  }
  function hide(panel) {
    if (panel._bwBusy || !panel.classList.contains('show')) return;
    panel._bwBusy = true;
    panel.style.height = panel.getBoundingClientRect().height + 'px';
    void panel.offsetHeight; // reflow, so the height change below is animated
    panel.classList.add('collapsing');
    panel.classList.remove('collapse', 'show');
    panel.style.height = '';
    setTriggers(panel, false);
    setTimeout(function () { finish(panel, false); }, DURATION);
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest ? e.target.closest('[data-toggle="collapse"]') : null;
    if (!trigger) return;
    var panel = document.querySelector(trigger.getAttribute('data-target') || trigger.getAttribute('href') || '');
    if (!panel) return;
    if (trigger.tagName === 'A') e.preventDefault();
    if (panel.classList.contains('show')) hide(panel); else show(panel);
  });

  // ------------------------------------------------------------------ scroll-spy
  var OFFSET = 100;       // same offset the site gave Bootstrap's scroll-spy
  var NAV = '#mainNav';
  var items = [];         // { top, link } sorted by top
  var active = null;
  var docHeight = 0;

  function refresh() {
    var nav = document.querySelector(NAV);
    items = [];
    if (!nav) return;
    Array.prototype.forEach.call(nav.querySelectorAll('.nav-link'), function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#' || href === '#') return; // absolute page links are not sections
      var target;
      try { target = document.querySelector(href); } catch (err) { return; }
      if (!target) return;
      var r = target.getBoundingClientRect();
      if (!(r.width || r.height)) return; // not visible
      items.push({ top: r.top + window.pageYOffset, link: link });
    });
    items.sort(function (a, b) { return a.top - b.top; });
    docHeight = scrollHeight();
  }
  function scrollHeight() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  }
  function activate(entry) {
    var nav = document.querySelector(NAV);
    if (!nav) return;
    Array.prototype.forEach.call(nav.querySelectorAll('.nav-link.active'), function (l) { l.classList.remove('active'); });
    active = entry;
    if (entry) entry.link.classList.add('active');
  }
  function process() {
    var scrollTop = window.pageYOffset + OFFSET;
    var height = scrollHeight();
    var maxScroll = OFFSET + height - window.innerHeight;
    if (height !== docHeight) refresh();
    if (!items.length) return;
    if (scrollTop >= maxScroll) {
      var last = items[items.length - 1];
      if (active !== last) activate(last);
      return;
    }
    if (active && scrollTop < items[0].top && items[0].top > 0) {
      activate(null);
      return;
    }
    for (var i = items.length; i--;) {
      var isNext = active !== items[i] && scrollTop >= items[i].top && (typeof items[i + 1] === 'undefined' || scrollTop < items[i + 1].top);
      if (isNext) { activate(items[i]); return; }
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; process(); });
  }, { passive: true });
  window.addEventListener('resize', function () { refresh(); process(); });
  document.addEventListener('DOMContentLoaded', function () { refresh(); process(); });
  window.addEventListener('load', function () { refresh(); process(); });

  window.bwNav = {
    hideMenu: function () { var p = document.querySelector('.navbar-collapse'); if (p) hide(p); },
    refreshSpy: function () { refresh(); process(); },
  };
})();
