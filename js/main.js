(function () {
  'use strict';

  /* ---- Horario: marca el día de hoy ---- */
  var days = document.querySelectorAll('#hours-days li');
  var today = (new Date().getDay() + 6) % 7; // 0 = lunes
  if (days[today]) days[today].classList.add('is-today');

  /* ---- Barra fija de contacto en móvil: aparece al pasar la portada ---- */
  var dock = document.getElementById('dock');
  var hero = document.querySelector('.hero');
  if (dock && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      dock.classList.toggle('is-on', !e[0].isIntersecting);
    }, { threshold: 0 }).observe(hero);
  }

  /* ---- Aparición suave al hacer scroll ---- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    document.documentElement.classList.add('js');
    var targets = document.querySelectorAll('.section__head, .card, .hours, .rule, .map');
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        ro.unobserve(el);
        el.classList.add('in');
        setTimeout(function () {
          el.classList.remove('reveal', 'in');
          el.style.transitionDelay = '';
        }, 1000);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      var col = el.classList.contains('card') ? i % 3 : 0;
      el.style.transitionDelay = (col * 90) + 'ms';
      ro.observe(el);
    });
  }

  /* ---- Modal de servicio ---- */
  var SERVICES = {
    descontracturante: {
      badgeIcon: 's-therapy',
      badgeClass: 'badge--white',
      title: 'Masaje descontracturante',
      tagline: 'Libera tensión · Recupera movilidad · Siéntete mejor',
      desc: 'Un masaje intenso y localizado que trabaja la musculatura para reducir contracturas, rigidez y sobrecargas musculares.',
      idealPara: ['Espalda', 'Cuello', 'Hombros', 'Piernas', 'Sobrecargas deportivas'],
      benefits: [
        'Alivia la tensión muscular.',
        'Ayuda a reducir molestias y sensación de sobrecarga.',
        'Mejora la movilidad y flexibilidad.',
        'Favorece la circulación de la zona.',
        'Aporta relajación y bienestar.'
      ],
      whatsappText: 'Hola, me gustaría pedir cita para: Masaje descontracturante.'
    }
  };

  var modal = document.getElementById('service-modal');
  if (modal) {
    var modalBadge = document.getElementById('modal-badge');
    var modalTitle = document.getElementById('modal-title');
    var modalTagline = document.getElementById('modal-tagline');
    var modalDesc = document.getElementById('modal-desc');
    var modalIdealPara = document.getElementById('modal-idealpara');
    var modalBenefits = document.getElementById('modal-benefits');
    var modalCta = document.getElementById('modal-cta');
    var lastFocused = null;

    function openModal(data) {
      modalBadge.className = 'badge modal__badge ' + data.badgeClass;
      modalBadge.innerHTML = '<svg class="ico" style="width:30px"><use href="#' + data.badgeIcon + '"/></svg>';
      modalTitle.textContent = data.title;
      modalTagline.textContent = data.tagline;
      modalDesc.textContent = data.desc;
      modalIdealPara.innerHTML = data.idealPara.map(function (t) { return '<li>' + t + '</li>'; }).join('');
      modalBenefits.innerHTML = data.benefits.map(function (t) { return '<li>' + t + '</li>'; }).join('');
      modalCta.href = 'https://wa.me/34640046600?text=' + encodeURIComponent(data.whatsappText);

      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');
      modal.querySelector('.modal__close').focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('[data-service]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var data = SERVICES[btn.getAttribute('data-service')];
        if (data) openModal(data);
      });
    });

    modal.querySelectorAll('[data-modal-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
  }

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
    pin.innerHTML = '<div class="pin__pulse"></div><div class="pin__body"></div><svg class="pin__logo" viewBox="0 0 546.724 229.281" aria-hidden="true"><use href="#kfg-mark"/></svg>';
    var marker = new M.Marker({ element: pin, anchor: 'bottom' }).setLngLat(LNGLAT).addTo(map);

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
