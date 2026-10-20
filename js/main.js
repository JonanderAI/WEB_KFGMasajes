(function () {
  'use strict';

  /* ---- Horario: marca el día de hoy ---- */
  var days = document.querySelectorAll('#hours-days li');
  var today = (new Date().getDay() + 6) % 7; // 0 = lunes
  if (days[today]) days[today].classList.add('is-today');

  /* ---- Mapa (OpenFreeMap + MapLibre), se carga al acercarse a la sección ---- */
  var mapEl = document.getElementById('map');
  if (!mapEl) return;

  var LNGLAT = [-3.0492, 43.2011]; // aproximado: verificar con la dirección real
  var started = false;

  function load(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  function css(href) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  function road(width, color) {
    return {
      type: 'line', source: 'omt', 'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': color,
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, width * 0.4, 18, width * 8]
      }
    };
  }

  function initMap() {
    var M = window.maplibregl;
    if (!M || started) return;
    started = true;

    var style = {
      version: 8,
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#E6F2EF' } },
        { id: 'landcover', type: 'fill', source: 'omt', 'source-layer': 'landcover', paint: { 'fill-color': '#D3EBE3' } },
        { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': '#CFE8E2' } },
        { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': '#9CCBE0' } },
        { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': '#9CCBE0', 'line-width': 2 } },
        { id: 'building', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 14, paint: { 'fill-color': '#D6EAF4', 'fill-outline-color': '#BFD9E6' } },
        Object.assign({ id: 'road-casing' }, road(1.5, '#C2DAD4')),
        Object.assign({ id: 'road' }, road(1.2, '#FFFFFF')),
        { id: 'road-label', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14,
          layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': 11 },
          paint: { 'text-color': '#4A6560', 'text-halo-color': '#FFFFFF', 'text-halo-width': 1.5 } },
        { id: 'place', type: 'symbol', source: 'omt', 'source-layer': 'place',
          layout: { 'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']], 'text-font': ['Noto Sans Bold'], 'text-size': 14, 'text-transform': 'uppercase', 'text-letter-spacing': 0.1 },
          paint: { 'text-color': '#1F7A73', 'text-halo-color': '#E6F2EF', 'text-halo-width': 2 } }
      ]
    };

    var map = new M.Map({ container: mapEl, style: style, center: LNGLAT, zoom: 16.3, scrollZoom: false, attributionControl: false });
    map.addControl(new M.NavigationControl({ showCompass: false }), 'top-right');

    var pin = document.createElement('div');
    pin.className = 'pin';
    pin.innerHTML = '<div class="pin__pulse"></div><div class="pin__dot"><svg viewBox="0 0 546.724 229.281" aria-hidden="true"><use href="#kfg-mark"/></svg></div>';
    var marker = new M.Marker({ element: pin }).setLngLat(LNGLAT).addTo(map);

    // Ajusta la posición con la dirección real (OpenStreetMap Nominatim)
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=' +
      encodeURIComponent('Autonomia Kalea 22, 48830 Sodupe'))
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r && r[0]) {
          var p = [parseFloat(r[0].lon), parseFloat(r[0].lat)];
          marker.setLngLat(p);
          map.jumpTo({ center: p });
        }
      })
      .catch(function () {});

    setTimeout(function () { map.resize(); }, 400);
  }

  function start() {
    css('vendor/maplibre-gl.css');
    load('vendor/maplibre-gl.js', initMap);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); start(); }
    }, { rootMargin: '600px 0px' });
    io.observe(mapEl);
  } else {
    start();
  }
})();
