/* Mula Bali Bamboo Villas — website tamu.
   Mengambil isi dari database (Supabase) lalu menggambar halaman.
   Bila database belum diatur / tidak bisa dihubungi, memakai default-content.js. */
(function () {
  'use strict';

  var CFG = window.MB_CONFIG || {};
  var DEFAULT = window.MB_DEFAULT_CONTENT || {};
  var C; // isi aktif

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ''; // javascript:, data:, dll ditolak
    return u; // relatif (img/...)
  }
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  // Lengkapi kunci yang hilang dari default (array dari database dipakai apa adanya)
  function fill(base, live) {
    if (!isObj(base)) return live === undefined ? base : live;
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = fill(base[k], isObj(live) ? live[k] : undefined); });
    if (isObj(live)) Object.keys(live).forEach(function (k) { if (!(k in out)) out[k] = live[k]; });
    return out;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function idr(n) { return 'IDR ' + Math.round(n).toLocaleString('en-US'); }
  function num(n) { return Math.round(n).toLocaleString('en-US'); }
  function hasPrice(p) { return typeof p === 'number' && isFinite(p) && p > 0; }
  function waNumber() { return String(C.contact.whatsapp || '').replace(/\D/g, '').replace(/^0/, '62'); }
  function waLink(text) {
    var n = waNumber();
    if (!n) return '#';
    return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function letters(text, start, step) {
    var k = 0;
    return String(text || '').split(' ').filter(Boolean).map(function (w) {
      return '<span class="mb-word">' + w.split('').map(function (ch) {
        var d = (start + (k++) * step).toFixed(3);
        return '<span class="mb-ch" style="animation-delay:' + d + 's">' + esc(ch) + '</span>';
      }).join('') + '</span>';
    }).join(' ');
  }
  function heading(tag, cls, text) {
    return '<' + tag + ' class="' + cls + '" aria-label="' + esc(text) + '"><span aria-hidden="true">' + letters(text, 0.15, 0.035) + '</span></' + tag + '>';
  }
  var ICON = {
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    left: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    minus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>',
    plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>',
    full: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    arrow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>',
    tick: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  var WA_IMG = 'img/whatsapp-logo.png';

  /* ---------- load ---------- */
  function loadContent() {
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) return Promise.resolve(null);
    var url = CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/site_content?id=eq.1&select=data';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 5000);
    return fetch(url, {
      headers: { apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey },
      signal: ctrl ? ctrl.signal : undefined,
      cache: 'no-store'
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) { clearTimeout(timer); return rows && rows[0] ? rows[0].data : null; })
      .catch(function () { clearTimeout(timer); return null; });
  }

  /* ---------- sections ---------- */
  function hero() {
    var h = C.hero;
    var t1 = h.titleLine1 || '', t2 = h.titleLine2 || '';
    function line(t, start) {
      return t.split('').map(function (ch, i) {
        return '<span class="mb-ch" style="animation-delay:' + (start + i * 0.07).toFixed(2) + 's">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>';
      }).join('');
    }
    var nav = '<div class="nav-links">' +
      '<a href="#about">About</a><a href="#gallery">Gallery</a>' + (C.tour.show !== false ? '<a href="#tour">360° Tour</a>' : '') +
      '</div><a class="brand" href="#top" aria-label="' + esc(C.brand.name) + ', home"><span class="brand-1">MULA BALI</span><span class="brand-2">BAMBOO VILLAS</span></a>' +
      '<div class="nav-links nav-right"><a href="#rates">Rates</a><a href="#contact">Contact</a><a class="nav-book" href="#' + (C.addons.show !== false ? 'extras' : 'book') + '">Book Now</a></div>';
    return '<section id="top" class="hero">' +
      '<img class="hero-img" src="' + esc(safeUrl(h.image)) + '" alt="' + esc(C.brand.name) + '" fetchpriority="high">' +
      '<div class="hero-shade"></div>' +
      '<header class="nav-wrap"><nav class="nav" aria-label="Main">' + nav + '</nav></header>' +
      '<div class="hero-body" id="heroBody">' +
      '<p class="hero-loc mb-rise">' + esc(C.brand.location) + '</p>' +
      '<h1 aria-label="' + esc(t1 + ' ' + t2) + '"><span aria-hidden="true">' + line(t1, 0.25) + '</span><span aria-hidden="true">' + line(t2, 0.25 + (t1.length + 1) * 0.07) + '</span></h1>' +
      '<p class="hero-sub mb-rise" style="animation-delay:1.9s">' + esc(h.subtitle) + '</p>' +
      '<div class="hero-cta mb-rise" style="animation-delay:2.15s">' +
      '<a class="btn btn-clay" href="#' + (C.addons.show !== false ? 'extras' : 'book') + '">' + esc(h.ctaPrimary) + '</a>' +
      (C.tour.show !== false ? '<a class="btn btn-ghost-light" href="#tour">' + esc(h.ctaSecondary) + '</a>' : '') +
      '</div></div></section>';
  }

  function about() {
    var a = C.about, slides = (a.slides || []).filter(function (s) { return s && s.image; });
    var stats = (a.stats || []).filter(function (s) { return s && (s.value || s.label); });
    return '<section id="about" class="about"><div class="wrap"><div class="about-grid">' +
      '<div class="mb-reveal">' +
      '<p class="eyebrow mb-rise">' + esc(a.eyebrow) + '</p>' + heading('h2', 'h2', a.title) +
      (a.paragraphs || []).filter(Boolean).map(function (p, i) {
        return '<p class="about-p mb-rise" style="animation-delay:' + (0.9 + i * 0.15).toFixed(2) + 's">' + esc(p) + '</p>';
      }).join('') +
      (stats.length ? '<div class="stats mb-rise" style="animation-delay:1.2s;grid-template-columns:repeat(' + stats.length + ',minmax(0,1fr))">' + stats.map(function (s) {
        return '<div><p class="stat-v">' + esc(s.value) + '</p><p class="stat-l">' + esc(s.label) + '</p></div>';
      }).join('') + '</div>' : '') +
      '</div>' +
      (slides.length ? '<div class="mb-reveal mb-stagger" style="min-width:0"><div>' +
        '<div class="carousel" id="carousel" aria-label="Villa photos, swipe to see more">' +
        slides.map(function (s, i) {
          return '<figure class="slide"><button type="button" class="zoom" data-lb="about" data-i="' + i + '" aria-label="View photo: ' + esc(s.caption) + '"><img src="' + esc(safeUrl(s.image)) + '" alt="' + esc(s.caption) + '" loading="lazy"></button>' +
            '<figcaption><span class="slide-num">' + pad2(i + 1) + '</span><span class="slide-cap">' + esc(s.caption) + '</span></figcaption></figure>';
        }).join('') + '</div>' +
        '<div class="slider-bar"><p class="slider-count" id="slCount">01 / ' + pad2(slides.length) + '</p>' +
        '<div class="slider-track"><div class="slider-fill" id="slFill" style="width:' + (100 / slides.length).toFixed(2) + '%"></div></div>' +
        '<button type="button" class="round-btn" id="slPrev" aria-label="Previous photo">' + ICON.left + '</button>' +
        '<button type="button" class="round-btn" id="slNext" aria-label="Next photo">' + ICON.right + '</button></div>' +
        '</div></div>' : '') +
      '</div></div></section>';
  }

  function gallery() {
    var g = C.gallery, photos = (g.photos || []).filter(function (p) { return p && p.image; });
    if (!photos.length) return '';
    return '<section id="gallery" class="gallery"><div class="wrap">' +
      '<div class="sec-head mb-reveal"><div><p class="eyebrow mb-rise">' + esc(g.eyebrow) + '</p>' + heading('h2', 'h2', g.title) + '</div>' +
      (g.text ? '<p class="lead mb-rise" style="animation-delay:.7s">' + esc(g.text) + '</p>' : '') + '</div>' +
      '<div class="gal-grid mb-reveal mb-stagger">' + photos.map(function (p, i) {
        return '<figure class="gal-item' + (p.tall ? ' tall' : '') + '"><button type="button" class="zoom" data-lb="gallery" data-i="' + i + '" aria-label="View photo: ' + esc(p.caption) + '"><img src="' + esc(safeUrl(p.image)) + '" alt="' + esc(p.caption) + '" loading="lazy"></button>' +
          (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>';
      }).join('') + '</div></div></section>';
  }

  function tour() {
    var t = C.tour;
    if (t.show === false || !t.panorama) return '';
    return '<section id="tour" class="tour"><div class="wrap">' +
      '<div class="sec-head mb-reveal"><div><p class="eyebrow mb-rise">' + esc(t.eyebrow) + '</p>' + heading('h2', 'h2', t.title) + '</div>' +
      (t.text ? '<p class="lead mb-rise" style="animation-delay:.9s">' + esc(t.text) + '</p>' : '') + '</div>' +
      '<div class="mb-reveal mb-stagger"><div class="tour-box" id="tourBox" role="region" tabindex="0" aria-label="360° virtual tour, drag to look around">' +
      '<img class="tour-img" id="tourImg" src="' + esc(safeUrl(t.panorama)) + '" alt="360° panorama of the villa" draggable="false">' +
      '<div class="tour-vignette" aria-hidden="true"></div>' +
      '<p class="tour-tag">' + ICON.globe + '360° · Drag to explore</p>' +
      '<div class="tour-ctrl">' +
      '<button type="button" class="lb-btn" id="tourOut" aria-label="Zoom out">' + ICON.minus + '</button>' +
      '<button type="button" class="lb-btn" id="tourIn" aria-label="Zoom in">' + ICON.plus + '</button>' +
      '<button type="button" class="lb-btn" id="tourFull" aria-label="Full screen">' + ICON.full + '</button>' +
      '</div></div></div></div></section>';
  }

  function rateCard(r, featured) {
    var price = hasPrice(r.price) ? num(r.price) : 'On request';
    var target = C.addons.show !== false ? '#extras' : '#book';
    return '<div><article class="rate' + (featured ? ' featured' : '') + '">' +
      (r.image ? '<div class="rate-media"><img class="rate-img" src="' + esc(safeUrl(r.image)) + '" alt="" loading="lazy">' +
        (featured && r.badge ? '<p class="rate-badge">' + esc(r.badge) + '</p>' : '') + '</div>' : '') +
      '<div class="rate-body"><div><p class="rate-label">' + esc(r.label) + '</p><p class="rate-nights">' + esc(r.nights) + '</p></div>' +
      '<div>' + (hasPrice(r.price) ? '<p class="rate-cur">IDR</p>' : '') + '<p class="rate-price">' + esc(price) + '</p><p class="rate-per">per night · entire villa</p></div>' +
      '<div class="rate-rule"></div>' +
      '<div class="rate-list">' + (r.features || []).filter(Boolean).map(function (f) { return '<p>' + ICON.check + esc(f) + '</p>'; }).join('') + '</div>' +
      '<a class="btn ' + (featured ? 'btn-clay' : 'btn-ghost') + '" href="' + target + '">' + esc(r.button || 'Book now') + '</a>' +
      '</div></article></div>';
  }

  function rates() {
    var r = C.rates;
    return '<section id="rates" class="rates"><div class="wrap">' +
      '<div class="center mb-reveal"><p class="eyebrow mb-rise">' + esc(r.eyebrow) + '</p>' + heading('h2', 'h2', r.title) +
      (r.text ? '<p class="lead mb-rise" style="animation-delay:.75s;font-size:17px">' + esc(r.text) + '</p>' : '') + '</div>' +
      '<div class="rate-grid mb-reveal mb-stagger">' + rateCard(r.standard, false) + rateCard(r.long, true) + '</div>' +
      (r.note ? '<p class="rate-note">' + esc(r.note) + '</p>' : '') +
      '</div></section>';
  }

  function extras() {
    var x = C.addons;
    if (x.show === false) return '';
    return '<section id="extras" class="extras"><div class="wrap">' +
      '<div class="sec-intro mb-reveal"><p class="eyebrow mb-rise">' + esc(x.eyebrow) + '</p>' + heading('h2', 'h2', x.title) +
      (x.text ? '<p class="lead mb-rise" style="animation-delay:.7s;font-size:17px">' + esc(x.text) + '</p>' : '') + '</div>' +
      '<div class="ex-grid"><div class="ex-left">' +
      '<div class="panel"><p class="panel-label">Your stay</p><div class="fields">' +
      '<div class="field"><label for="ci">Check-in</label><input id="ci" type="date"></div>' +
      '<div class="field"><label for="co">Check-out</label><input id="co" type="date"></div>' +
      '<div class="field"><p class="flabel" id="gLabel">Guests</p><div class="step" role="group" aria-labelledby="gLabel">' +
      '<button type="button" id="gDec" aria-label="Fewer guests">' + ICON.minus + '</button><span id="gVal" aria-live="polite">2</span>' +
      '<button type="button" id="gInc" aria-label="More guests">' + ICON.plus + '</button></div></div>' +
      '</div><p class="date-err" id="dateErr" hidden>Check-out must be after check-in.</p></div>' +
      '<div class="ex-list mb-reveal mb-stagger" id="exList"></div>' +
      '</div>' +
      '<aside class="ex-summary" aria-label="Booking summary" id="exSummary"></aside>' +
      '</div></div></section>';
  }

  function booking() {
    var b = C.booking;
    var links = (b.links || []).filter(function (l) { return l && l.name && safeUrl(l.url); });
    return '<section id="book" class="book"><div class="wrap">' +
      '<div class="center mb-reveal"><p class="eyebrow mb-rise">' + esc(b.eyebrow) + '</p>' + heading('h2', 'h2', b.title) + '</div>' +
      '<div class="steps mb-reveal mb-stagger">' + (b.steps || []).filter(function (s) { return s && s.title; }).map(function (s, i) {
        return '<div><p class="step-n">' + pad2(i + 1) + '</p><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>';
      }).join('') + '</div>' +
      '<div class="book-links mb-reveal mb-stagger">' + links.map(function (l) {
        return '<a class="book-link" href="' + esc(safeUrl(l.url)) + '" target="_blank" rel="noopener">' + esc(l.name) + '<span>→</span></a>';
      }).join('') +
      (waNumber() ? '<a class="book-link wa" href="' + esc(waLink('Hello Mula Bali, I would like to ask about availability.')) + '" target="_blank" rel="noopener">WhatsApp us<span>→</span></a>' : '') +
      '</div></div></section>';
  }

  function footer() {
    var c = C.contact;
    var socials = (C.social || []).filter(function (s) { return s && s.name && safeUrl(s.url); });
    return '<footer id="contact" class="foot"><div class="foot-in"><div class="foot-top">' +
      '<div><p class="foot-brand">MULA BALI</p><p class="foot-brand2">BAMBOO VILLAS</p><p style="margin:0;font-size:14px">' + esc(c.address) + '</p>' +
      (safeUrl(c.mapsUrl) ? '<p style="margin:10px 0 0;font-size:14px"><a class="foot-link" href="' + esc(safeUrl(c.mapsUrl)) + '" target="_blank" rel="noopener">Open in Google Maps</a></p>' : '') + '</div>' +
      '<div class="foot-col"><p class="foot-h">Contact</p>' +
      (waNumber() ? '<a class="foot-link" href="' + esc(waLink('')) + '" target="_blank" rel="noopener">WhatsApp · ' + esc(c.whatsappDisplay || '+' + waNumber()) + '</a>' : '') +
      (c.email ? '<a class="foot-link" href="mailto:' + esc(c.email) + '">Email · ' + esc(c.email) + '</a>' : '') +
      '</div></div>' +
      '<div class="foot-bar"><p>© ' + new Date().getFullYear() + ' ' + esc(C.brand.name) + '</p>' +
      (socials.length ? '<nav class="socials" aria-label="Social media">' + socials.map(function (s) {
        return '<a class="social" href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>';
      }).join('<i aria-hidden="true"></i>') + '</nav>' : '') +
      '</div></div></footer>';
  }

  function floatingWa() {
    if (!waNumber()) return '';
    return '<a class="wa-float" href="' + esc(waLink('')) + '" target="_blank" rel="noopener" aria-label="Chat with ' + esc(C.brand.name) + ' on WhatsApp">' +
      '<span class="wa-label" aria-hidden="true"><span class="wa-kicker">Need help?</span><span class="wa-main">Chat with us</span></span>' +
      '<img class="wa-icon" src="' + WA_IMG + '" alt="" width="60" height="60"></a>';
  }

  function overlays() {
    return '<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" tabindex="-1" hidden>' +
      '<button type="button" class="lb-btn lb-close" data-lbx="close" aria-label="Close photo">' + ICON.close + '</button>' +
      '<button type="button" class="lb-btn lb-prev" data-lbx="prev" aria-label="Previous photo">' + ICON.left + '</button>' +
      '<button type="button" class="lb-btn lb-next" data-lbx="next" aria-label="Next photo">' + ICON.right + '</button>' +
      '<figure><img id="lbImg" alt=""><figcaption><span class="lb-cap" id="lbCap"></span><span class="lb-count" id="lbCount"></span></figcaption></figure></div>' +
      '<div class="exd" id="exd" role="dialog" aria-modal="true" tabindex="-1" hidden></div>';
  }

  /* ---------- page lock ---------- */
  var locks = 0;
  function lockPage(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    document.documentElement.style.overflow = locks ? 'hidden' : '';
    document.body.style.overflow = locks ? 'hidden' : '';
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var els = [].slice.call(document.querySelectorAll('.mb-reveal'));
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('mb-go'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('mb-go'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- slider ---------- */
  function initSlider() {
    var el = document.getElementById('carousel');
    if (!el) return;
    var total = el.children.length;
    var count = document.getElementById('slCount'), fill = document.getElementById('slFill');
    function w() { var f = el.querySelector('.slide'); return f ? f.getBoundingClientRect().width + 16 : el.clientWidth; }
    function update() {
      var k = Math.round(el.scrollLeft / w());
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) k = total - 1;
      k = Math.max(0, Math.min(total - 1, k));
      count.textContent = pad2(k + 1) + ' / ' + pad2(total);
      fill.style.width = ((k + 1) / total * 100).toFixed(2) + '%';
    }
    el.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    document.getElementById('slPrev').addEventListener('click', function () { el.scrollBy({ left: -w(), behavior: 'smooth' }); });
    document.getElementById('slNext').addEventListener('click', function () { el.scrollBy({ left: w(), behavior: 'smooth' }); });
  }

  /* ---------- lightbox ---------- */
  function initLightbox() {
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lbImg'), cap = document.getElementById('lbCap'), cnt = document.getElementById('lbCount');
    var set = [], idx = 0, opener = null;
    function sets(name) {
      if (name === 'about') return (C.about.slides || []).filter(function (s) { return s && s.image; });
      return (C.gallery.photos || []).filter(function (s) { return s && s.image; });
    }
    function show() {
      var p = set[idx];
      img.src = safeUrl(p.image); img.alt = p.caption || '';
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      cap.textContent = p.caption || ''; cnt.textContent = (idx + 1) + ' / ' + set.length;
    }
    function open(name, i, from) { set = sets(name); idx = i; opener = from; show(); box.hidden = false; lockPage(true); box.focus(); }
    function close() { if (box.hidden) return; box.hidden = true; lockPage(false); if (opener) opener.focus(); }
    function go(d) { idx = (idx + d + set.length) % set.length; show(); }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lb]');
      if (b) open(b.getAttribute('data-lb'), +b.getAttribute('data-i'), b);
    });
    box.addEventListener('click', function (e) {
      var a = e.target.closest('[data-lbx]');
      if (a) { e.stopPropagation(); var k = a.getAttribute('data-lbx'); if (k === 'close') close(); else go(k === 'next' ? 1 : -1); return; }
      if (e.target === box) close();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
    });
    var sx = null;
    box.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    });
  }

  /* ---------- 360 tour ---------- */
  function initTour() {
    var box = document.getElementById('tourBox');
    if (!box) return;
    var img = document.getElementById('tourImg');
    var t = { x: 0, y: 0, z: 1, base: 1, w: 1, h: 1, drag: false, idle: 0, dir: -1, ready: false, minX: 0 };
    function apply() {
      var S = t.base * t.z, bw = box.clientWidth, bh = box.clientHeight;
      t.minX = Math.min(0, bw - t.w * S);
      t.x = Math.min(0, Math.max(t.minX, t.x));
      t.y = Math.min(0, Math.max(Math.min(0, bh - t.h * S), t.y));
      img.style.transform = 'translate3d(' + t.x.toFixed(2) + 'px,' + t.y.toFixed(2) + 'px,0) scale(' + S.toFixed(4) + ')';
    }
    function layout(center) {
      if (!t.ready) return;
      var bw = box.clientWidth, bh = box.clientHeight, S0 = t.base * t.z;
      var cx = (bw / 2 - t.x) / S0, cy = (bh / 2 - t.y) / S0;
      t.base = Math.max(bh * 1.12 / t.h, bw / t.w);
      var S = t.base * t.z;
      if (center) { t.x = (bw - t.w * S) / 2; t.y = (bh - t.h * S) / 2; }
      else { t.x = bw / 2 - cx * S; t.y = bh / 2 - cy * S; }
      apply();
    }
    function zoom(f) {
      if (!t.ready) return;
      var bw = box.clientWidth, bh = box.clientHeight, S0 = t.base * t.z;
      var cx = (bw / 2 - t.x) / S0, cy = (bh / 2 - t.y) / S0;
      t.z = Math.min(2.6, Math.max(1, t.z * f));
      var S1 = t.base * t.z; t.x = bw / 2 - cx * S1; t.y = bh / 2 - cy * S1;
      t.idle = Date.now() + 5000; apply();
    }
    function ready() {
      t.w = img.naturalWidth; t.h = img.naturalHeight;
      img.style.width = t.w + 'px'; img.style.height = t.h + 'px';
      t.ready = true; layout(true);
      if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        (function step() {
          if (t.ready && !t.drag && Date.now() > t.idle && !document.hidden) {
            t.x += t.dir * 0.35;
            if (t.x <= t.minX) t.dir = 1;
            if (t.x >= 0) t.dir = -1;
            apply();
          }
          requestAnimationFrame(step);
        })();
      }
    }
    if (img.complete && img.naturalWidth) ready(); else img.addEventListener('load', ready);
    window.addEventListener('resize', function () { layout(false); });
    box.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      t.drag = true; t.px = e.clientX; t.py = e.clientY; box.style.cursor = 'grabbing';
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
    });
    box.addEventListener('pointermove', function (e) {
      if (!t.drag) return;
      t.x += e.clientX - t.px; t.y += e.clientY - t.py; t.px = e.clientX; t.py = e.clientY; apply();
    });
    function up() { t.drag = false; t.idle = Date.now() + 3500; box.style.cursor = ''; }
    box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
    document.getElementById('tourIn').addEventListener('click', function () { zoom(1.25); });
    document.getElementById('tourOut').addEventListener('click', function () { zoom(0.8); });
    var fullBtn = document.getElementById('tourFull');
    function setFull(on) {
      if (box.classList.contains('is-full') === on) return;
      box.classList.toggle('is-full', on); lockPage(on);
      fullBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
      requestAnimationFrame(function () { requestAnimationFrame(function () { layout(false); }); });
    }
    fullBtn.addEventListener('click', function () { setFull(!box.classList.contains('is-full')); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setFull(false);
      if (e.key === 'ArrowLeft') { t.x += 60; t.idle = Date.now() + 4000; apply(); }
      if (e.key === 'ArrowRight') { t.x -= 60; t.idle = Date.now() + 4000; apply(); }
    });
  }

  /* ---------- add-ons & summary ---------- */
  function initExtras() {
    var list = document.getElementById('exList');
    if (!list) return;
    var items = (C.addons.items || []).filter(function (a) { return a && a.name; });
    var R = C.rates, maxG = Math.max(1, +R.maxGuests || 4), longFrom = Math.max(2, +R.longStayFrom || 3);
    var st = { ci: '', co: '', g: Math.min(2, maxG), q: {}, open: null };
    var ci = document.getElementById('ci'), co = document.getElementById('co');
    var today = new Date(); var todayS = today.getFullYear() + '-' + pad2(today.getMonth() + 1) + '-' + pad2(today.getDate());
    ci.min = todayS; co.min = todayS;
    var exd = document.getElementById('exd'), opener = null;

    function nice(d) {
      var p = d.split('-');
      return +p[2] + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1] + ' ' + p[0];
    }
    function nights() {
      if (!st.ci || !st.co) return 0;
      return Math.round((Date.parse(st.co + 'T00:00:00Z') - Date.parse(st.ci + 'T00:00:00Z')) / 86400000);
    }
    function cap(a) { return a.mode === 'once' ? 1 : a.mode === 'guest' ? st.g : Math.max(1, +a.max || 1); }
    function qty(a) { return Math.min(st.q[a.id] || 0, cap(a)); }
    function priceText(a) { return hasPrice(a.price) ? idr(a.price) : 'On request'; }
    function askLink(a) {
      var lines = ['Hello Mula Bali, I have a question about the ' + a.name + ' before booking.'];
      var n = nights();
      if (n > 0) lines.push('My dates: ' + nice(st.ci) + ' – ' + nice(st.co) + ', ' + st.g + ' guests.');
      return waLink(lines.join('\n'));
    }
    function control(a, big) {
      var q = qty(a);
      if (a.mode === 'once') {
        return '<button type="button" class="ex-add' + (big ? ' ex-add-lg' : '') + (q ? ' is-on' : '') + '" data-act="flip" data-id="' + esc(a.id) + '" aria-pressed="' + (q ? 'true' : 'false') + '">' +
          (q ? ICON.tick : '') + (big ? (q ? 'Added to your stay' : 'Add to your stay') : (q ? 'Added' : 'Add')) + '</button>';
      }
      return '<div class="step step-sm" role="group" aria-label="' + esc(a.name) + ' quantity">' +
        '<button type="button" data-act="dec" data-id="' + esc(a.id) + '" aria-label="Remove one">' + ICON.minus + '</button>' +
        '<span aria-live="polite">' + q + '</span>' +
        '<button type="button" data-act="inc" data-id="' + esc(a.id) + '" aria-label="Add one">' + ICON.plus + '</button></div>';
    }
    function renderList() {
      list.innerHTML = items.map(function (a, i) {
        var on = qty(a) > 0;
        return '<article class="addon' + (on ? ' is-on' : '') + '">' +
          '<button type="button" class="addon-media" data-act="view" data-id="' + esc(a.id) + '" aria-label="View details: ' + esc(a.name) + '">' +
          (a.image ? '<img src="' + esc(safeUrl(a.image)) + '" alt="" loading="lazy">' : '') +
          '<span class="addon-num">' + pad2(i + 1) + '</span><span class="addon-badge">Added</span>' +
          '<span class="addon-view">View details' + ICON.arrow + '</span></button>' +
          '<div class="addon-body"><div class="addon-top"><p class="ex-unit">' + esc(a.unit) + '</p><p class="ex-price">' + esc(priceText(a)) + '</p></div>' +
          '<h3>' + esc(a.name) + '</h3><p class="addon-desc">' + esc(a.desc) + '</p>' +
          '<div class="addon-actions">' + control(a, false) +
          '<a class="ask" href="' + esc(askLink(a)) + '" target="_blank" rel="noopener" aria-label="Ask about ' + esc(a.name) + ' on WhatsApp"><img src="' + WA_IMG + '" alt="" width="18" height="18">Ask first</a>' +
          '</div></div></article>';
      }).join('');
    }
    function renderSummary() {
      var n = nights(), bad = !!(st.ci && st.co && n <= 0);
      document.getElementById('dateErr').hidden = !bad;
      if (n < 0) n = 0;
      var long = n >= longFrom, rate = long ? R.long.price : R.standard.price;
      var room = n > 0 && hasPrice(rate) ? rate * n : null;
      var unpriced = false, extra = 0, lines = [];
      items.forEach(function (a) {
        var q = qty(a);
        if (!q) return;
        var amt = hasPrice(a.price) ? a.price * q : null;
        if (amt == null) unpriced = true; else extra += amt;
        lines.push({ label: a.name + (a.mode === 'once' ? '' : ' × ' + q), amount: amt == null ? 'On request' : idr(amt) });
      });
      var roomLabel = 'Villa', roomText = 'Select dates';
      if (n > 0) {
        roomLabel = (long ? R.long.label : 'Villa') + ' · ' + n + (n === 1 ? ' night' : ' nights');
        roomText = room != null ? idr(room) : (long ? 'Long-stay rate' : 'On request');
      }
      var total = '—', note = '';
      if (n > 0) {
        if (room != null && !unpriced) total = idr(room + extra);
        else { total = 'On request'; note = 'Some prices are confirmed by our team on WhatsApp.'; }
      }
      var msg = ['Hello Mula Bali, I would like to request a booking.',
        'Check-in: ' + (st.ci ? nice(st.ci) : '-'), 'Check-out: ' + (st.co ? nice(st.co) : '-'),
        'Nights: ' + (n || '-'), 'Guests: ' + st.g];
      if (lines.length) { msg.push('Add-ons:'); lines.forEach(function (l) { msg.push('- ' + l.label); }); }
      document.getElementById('exSummary').innerHTML =
        '<p class="sum-kicker">Your summary</p><p class="sum-title">' + esc(C.brand.name) + '</p>' +
        '<div class="sum-row"><span>Dates</span><span>' + (st.ci && st.co && n > 0 ? nice(st.ci) + ' – ' + nice(st.co) : 'Not selected') + '</span></div>' +
        '<div class="sum-row"><span>Guests</span><span>' + st.g + '</span></div>' +
        '<div class="sum-row"><span>' + esc(roomLabel) + '</span><span>' + esc(roomText) + '</span></div>' +
        (lines.length ? '<p class="sum-h">Add-ons</p>' + lines.map(function (l) {
          return '<div class="sum-row sum-sub"><span>' + esc(l.label) + '</span><span>' + esc(l.amount) + '</span></div>';
        }).join('') : '') +
        '<div class="sum-rule"></div><div class="sum-total"><span>Total</span><span>' + esc(total) + '</span></div>' +
        (note ? '<p class="sum-note">' + esc(note) + '</p>' : '') +
        '<a class="ex-cta" href="' + esc(waLink(msg.join('\n'))) + '" target="_blank" rel="noopener">Request via WhatsApp</a>' +
        '<p class="sum-foot">No payment now. We’ll confirm availability and the final price.</p>';
    }
    function renderDetail() {
      var a = items.filter(function (x) { return x.id === st.open; })[0];
      if (!a) { if (!exd.hidden) { exd.hidden = true; lockPage(false); if (opener) opener.focus(); } return; }
      var i = items.indexOf(a);
      exd.setAttribute('aria-label', a.name);
      exd.innerHTML = '<div class="exd-card"><div class="exd-media">' + (a.image ? '<img src="' + esc(safeUrl(a.image)) + '" alt="' + esc(a.name) + '">' : '') +
        '<span class="addon-num">' + pad2(i + 1) + '</span></div><div class="exd-body">' +
        '<button type="button" class="exd-close" data-act="close" aria-label="Close details">' + ICON.close + '</button>' +
        '<p class="exd-kicker">Add to your stay</p><h3>' + esc(a.name) + '</h3><p class="exd-desc">' + esc(a.desc) + '</p>' +
        (a.detail ? '<p class="exd-detail">' + esc(a.detail) + '</p>' : '') +
        '<div class="exd-price"><span>' + esc(priceText(a)) + '</span><span class="ex-unit">' + esc(a.unit) + '</span></div>' +
        '<div class="exd-actions">' + control(a, true) +
        '<a class="exd-ask" href="' + esc(askLink(a)) + '" target="_blank" rel="noopener"><img src="' + WA_IMG + '" alt="" width="20" height="20">Ask on WhatsApp</a></div>' +
        '<p class="exd-hint">Not sure yet? Ask us anything first — asking doesn’t book anything.</p>' +
        '<button type="button" class="exd-done" data-act="close">Back to all extras</button></div></div>';
      if (exd.hidden) { exd.hidden = false; lockPage(true); exd.focus(); }
    }
    function all() { document.getElementById('gVal').textContent = st.g; renderList(); renderSummary(); renderDetail(); }
    function act(e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var a = items.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0];
      var k = b.getAttribute('data-act');
      if (k === 'close') { st.open = null; renderDetail(); return; }
      if (!a) return;
      if (k === 'view') { opener = b; st.open = a.id; renderDetail(); return; }
      var q = qty(a);
      if (k === 'flip') st.q[a.id] = q ? 0 : 1;
      if (k === 'inc') st.q[a.id] = Math.min(cap(a), q + 1);
      if (k === 'dec') st.q[a.id] = Math.max(0, q - 1);
      all();
    }
    list.addEventListener('click', act);
    exd.addEventListener('click', function (e) {
      if (e.target === exd) { st.open = null; renderDetail(); return; }
      e.stopPropagation(); act(e);
    });
    exd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { st.open = null; renderDetail(); } });
    ci.addEventListener('change', function () { st.ci = ci.value; co.min = ci.value || todayS; all(); });
    co.addEventListener('change', function () { st.co = co.value; all(); });
    document.getElementById('gInc').addEventListener('click', function () { st.g = Math.min(maxG, st.g + 1); all(); });
    document.getElementById('gDec').addEventListener('click', function () { st.g = Math.max(1, st.g - 1); all(); });
    all();
  }

  /* ---------- boot ---------- */
  function render() {
    document.title = C.seo.title || C.brand.name;
    var md = document.querySelector('meta[name="description"]');
    if (md && C.seo.description) md.setAttribute('content', C.seo.description);
    if (C.brand.loaderImage) document.getElementById('loaderImg').src = safeUrl(C.brand.loaderImage);
    document.getElementById('app').innerHTML = hero() + about() + gallery() + tour() + rates() + extras() + booking() + footer() + floatingWa() + overlays();
    initReveal(); initSlider(); initLightbox(); initTour(); initExtras();
  }

  var started = Date.now();
  loadContent().then(function (live) {
    C = fill(DEFAULT, live || {});
    try { render(); } catch (err) { console.error(err); C = DEFAULT; render(); }
    var wait = Math.max(0, 2600 - (Date.now() - started));
    setTimeout(function () {
      document.getElementById('loader').classList.add('is-out');
      document.getElementById('heroBody').classList.add('mb-go');
      setTimeout(function () { var l = document.getElementById('loader'); if (l) l.remove(); }, 800);
    }, wait);
  });
})();
