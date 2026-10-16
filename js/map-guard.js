// Maps must not hijack the page scroll. Leaflet zooms on every mouse wheel tick by default, so scrolling the page with the
// pointer over a map zoomed the map instead (and kept zooming while the visitor kept scrolling). This hook runs for every
// Leaflet map on the site (load it right after leaflet-src.min.js): the wheel zoom is off until the visitor clicks or drags the
// map, and it goes off again when the pointer leaves, the map loses focus or the visitor presses Escape. While it is off, a wheel
// turn over the map shows a short hint. Dragging, the +/- buttons, double click, pinch and the keyboard keep working.
(function () {
  if (typeof L === 'undefined' || !L.Map || !L.Map.addInitHook) return;
  L.Map.addInitHook(function () {
    var map = this;
    var el = map.getContainer();
    var hint = document.createElement('div');
    hint.className = 'bw-map-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = 'Click the map, then scroll to zoom';
    el.appendChild(hint);
    var timer = 0;

    map.scrollWheelZoom.disable();

    function activate() {
      map.scrollWheelZoom.enable();
      el.classList.add('bw-map-active');
      hint.classList.remove('show');
    }
    function deactivate() {
      map.scrollWheelZoom.disable();
      el.classList.remove('bw-map-active');
    }
    el.addEventListener('mousedown', activate);
    el.addEventListener('touchstart', activate, { passive: true });
    el.addEventListener('mouseleave', deactivate);
    el.addEventListener('focusout', function (e) {
      if (!e.relatedTarget || !el.contains(e.relatedTarget)) deactivate();
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') deactivate();
    });
    el.addEventListener('wheel', function () {
      if (el.classList.contains('bw-map-active')) return;
      hint.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(function () { hint.classList.remove('show'); }, 1400);
    }, { passive: true });
  });
})();
