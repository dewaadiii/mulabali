/* Mula Bali Bamboo Villas – static site script (no framework needed) */
(function () {
  'use strict';

  /* =========================================================
     Semua isi website diambil dari folder content/*.json.
     Ubah lewat halaman admin: https://mulabalibamboovillas.com/admin
     ========================================================= */
  var FILES = ['kontak', 'beranda', 'galeri', 'harga', 'addon', 'booking'];
  var t0 = Date.now();
  var lockCount = 0;
  var lockPage = function (on) {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    var v = lockCount ? 'hidden' : '';
    document.body.style.overflow = v;
    document.documentElement.style.overflow = v;
  };
  lockPage(true);
  var load = function (f) {
    return fetch('content/' + f + '.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(f); return r.json(); })
      .catch(function (err) { if (window.console) console.warn('Mula Bali: could not load content/' + f + '.json'); return {}; });
  };
  Promise.all(FILES.map(load)).then(function (arr) {
    var C = {};
    FILES.forEach(function (f, i) { C[f] = arr[i] || {}; });
    start(C);
  });

  function start(C) {
  var $ = function (id) { return document.getElementById(id); };
  var get = function (path) {
    return path.split('.').reduce(function (o, k) { return o && o[k] != null ? o[k] : undefined; }, C);
  };
  var num = function (v) { return v === '' || v == null || isNaN(Number(v)) ? null : Number(v); };
  var str = function (v) { return v == null ? '' : String(v).trim(); };
  var arr = function (v) { return Array.isArray(v) ? v : []; };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad2 = function (x) { return (x < 10 ? '0' : '') + x; };
  var el = function (tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  // Links and photos typed in the admin are only used when they are safe
  // (https/http, mailto, tel, or a file on this website) — blocks javascript: tricks.
  var safeUrl = function (u) {
    u = str(u);
    if (!u) return '';
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (/^\/(?!\/)/.test(u) || /^(img|content)\//i.test(u)) return u;
    return '';
  };
  var fmtNum = function (n) { return Math.round(n).toLocaleString('en-US'); };
  var fmt = function (n) { return 'IDR ' + fmtNum(n); };

  /* ---------- WhatsApp number (accepts 0878..., +62 878..., 62878...) ---------- */
  var waDigits = str(get('kontak.whatsapp')).replace(/\D/g, '');
  if (waDigits.charAt(0) === '0') waDigits = '62' + waDigits.slice(1);
  else if (waDigits.charAt(0) === '8') waDigits = '62' + waDigits;
  if (!waDigits) waDigits = '6287823085069';
  var WA_NUMBER = waDigits;
  var waPretty = (function () {
    if (WA_NUMBER.indexOf('62') !== 0) return '+' + WA_NUMBER;
    var r = WA_NUMBER.slice(2), parts = [r.slice(0, 3), r.slice(3, 7), r.slice(7)].filter(Boolean);
    return '+62 ' + parts.join('-');
  })();
  var waLink = function (text) { return 'https://wa.me/' + WA_NUMBER + (text ? '?text=' + encodeURIComponent(text) : ''); };

  /* ---------- Fill simple texts, images and links ---------- */
  document.querySelectorAll('[data-cms]').forEach(function (n) {
    var v = get(n.getAttribute('data-cms'));
    if (v == null) return;
    v = str(v);
    if (!v) { n.hidden = true; return; }
    n.textContent = v;
    var par = n.parentNode;
    if (n.getAttribute('aria-hidden') === 'true' && par && par.tagName === 'H2') par.setAttribute('aria-label', v);
  });
  document.querySelectorAll('[data-cms-src]').forEach(function (n) {
    var v = safeUrl(get(n.getAttribute('data-cms-src')));
    if (v) n.src = v;
  });
  document.querySelectorAll('[data-cms-href]').forEach(function (n) {
    var v = safeUrl(get(n.getAttribute('data-cms-href')));
    if (v) n.href = v;
  });
  document.querySelectorAll('[data-cms-lines]').forEach(function (n) {
    var v = get(n.getAttribute('data-cms-lines'));
    if (v != null) n.innerHTML = str(v).split(/\n/).map(esc).join('<br>');
  });
  document.querySelectorAll('[data-cms-price]').forEach(function (n) {
    var path = n.getAttribute('data-cms-price');
    var parts = path.split('.'), obj = get(parts.slice(0, -1).join('.'));
    if (!obj) return;
    var v = num(obj[parts[parts.length - 1]]);
    n.textContent = v != null ? fmtNum(v) : 'On request';
  });
  (function () {
    var t1 = str(get('beranda.hero.title1')), t2 = str(get('beranda.hero.title2'));
    var h = document.querySelector('[data-letters="10"]');
    if (h && t1) h.setAttribute('data-letters', String(t1.length + 1));
    if (t1 || t2) $('mb-h1').setAttribute('aria-label', (t1 + ' ' + t2).trim());
  })();
  var map = str(get('booking.location.map_search'));
  if (map) $('cms-map').src = 'https://maps.google.com/maps?q=' + encodeURIComponent(map) + '&z=15&output=embed';

  // WhatsApp links everywhere
  document.querySelectorAll('[data-wa]').forEach(function (n) { n.href = waLink(n.getAttribute('data-wa')); });
  $('mb-wa').setAttribute('aria-label', 'Chat with Mula Bali on WhatsApp, ' + waPretty);
  $('cms-foot-wa').textContent = 'WhatsApp · ' + waPretty;
  var email = str(get('kontak.email'));
  if (email && email.indexOf('@') > 0) $('cms-foot-email').innerHTML = 'Email · <a class="mb-foot-link" href="mailto:' + esc(email) + '">' + esc(email) + '</a>';
  else if (C.kontak.email != null) $('cms-foot-email').textContent = 'Email · ' + (email || '-');

  // Social media (links without an address are hidden)
  var social = arr(get('kontak.social')).filter(function (s) { return str(s.name) && safeUrl(s.url); });
  if (C.kontak.social) {
    $('cms-social').innerHTML = social.map(function (s, i) {
      return (i ? '<span aria-hidden="true" style="width: 3px; height: 3px; border-radius: 50%; background: rgba(251,246,239,0.3)"></span>' : '') +
        '<a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener" class="mb-social">' + esc(str(s.name)) + '</a>';
    }).join('');
  }

  // About: paragraphs + numbers
  var paras = arr(get('beranda.about.paragraphs')).map(str).filter(Boolean);
  if (paras.length) {
    $('cms-about-text').innerHTML = paras.map(function (t, i) {
      return '<p class="mb-rise" style="margin: 0 0 ' + (i === paras.length - 1 ? 32 : 16) + 'px; font-size: 17px; color: #5A4334; animation-delay: ' + (0.9 + i * 0.15).toFixed(2) + 's">' + esc(t) + '</p>';
    }).join('');
  }
  var stats = arr(get('beranda.about.stats')).filter(function (s) { return str(s.number) || str(s.label); });
  if (stats.length) {
    $('cms-stats').style.gridTemplateColumns = 'repeat(' + Math.min(stats.length, 3) + ', minmax(0, 1fr))';
    $('cms-stats').innerHTML = stats.map(function (s) {
      return '<div><p style="margin: 0; font-family: \'Cormorant Garamond\', serif; font-size: 40px; line-height: 1; color: #A4502B">' + esc(str(s.number)) + '</p>' +
        '<p style="margin: 6px 0 0; font-size: 14px; color: #5A4334">' + esc(str(s.label)) + '</p></div>';
    }).join('');
  }

  // Rate cards: inclusion lists
  function rateList(id, items, color) {
    items = arr(items).map(str).filter(Boolean);
      $(id).innerHTML = items.map(function (t) {
      return '<p style="margin: 0; display: flex; gap: 10px; align-items: flex-start"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0; margin-top: 3px"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>' + esc(t) + '</p>';
    }).join('');
  }
  if (C.harga.standard) rateList('cms-std-list', C.harga.standard.features, '#A4502B');
  if (C.harga.long) rateList('cms-long-list', C.harga.long.features, '#E9A57F');

  // Booking steps + platforms
  var steps = arr(get('booking.steps')).filter(function (s) { return str(s.title) || str(s.text); });
  if (steps.length) {
    $('cms-steps').innerHTML = steps.map(function (s, i) {
      return '<div><p style="margin: 0 0 8px; font-family: \'Cormorant Garamond\', serif; font-size: 48px; line-height: 1; color: #A4502B">' + pad2(i + 1) + '</p>' +
        '<h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700">' + esc(str(s.title)) + '</h3>' +
        '<p style="margin: 0; color: #5A4334">' + esc(str(s.text)) + '</p></div>';
    }).join('');
  }
  if (C.booking.platforms) {
    var plats = arr(C.booking.platforms).filter(function (p) { return str(p.name) && safeUrl(p.url); });
    var waBtn = str(get('booking.wa_button')) || 'WhatsApp us';
    $('cms-platforms').innerHTML = plats.map(function (p) {
      return '<a href="' + esc(safeUrl(p.url)) + '" target="_blank" rel="noopener" style="text-decoration: none; background: #FBF6EF; color: #3A2418; border: 1px solid #DCCBB6; border-radius: 6px; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center; font-weight: 700">' + esc(str(p.name)) + '<span style="font-weight: 500; color: #A4502B">→</span></a>';
    }).join('') +
      '<a href="' + esc(waLink()) + '" target="_blank" rel="noopener" style="text-decoration: none; background: #3A2418; color: #FBF6EF; border-radius: 6px; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center; font-weight: 700">' + esc(waBtn) + '<span style="font-weight: 500">→</span></a>';
  }

  /* ---------- Data for the interactive parts ---------- */
  var STANDARD_RATE = num(get('harga.standard.price'));
  var LONG_STAY_RATE = num(get('harga.long.price'));
  var LONG_MIN = num(get('harga.long.min_nights')) || 3;
  var MAX_GUESTS = num(get('beranda.about.max_guests')) || 4;
  var toPhoto = function (p) {
    return { src: safeUrl(p.image), alt: str(p.alt) || str(p.caption), caption: str(p.caption), tall: !!p.tall, pos: str(p.pos) || 'center' };
  };
  var PHOTOS = arr(get('galeri.photos')).filter(function (p) { return safeUrl(p.image); }).map(toPhoto);
  var SLIDE_PHOTOS = arr(get('beranda.about.slides')).filter(function (p) { return safeUrl(p.image); }).map(toPhoto);
  var ADDONS = arr(get('addon.addons')).filter(function (a) { return str(a.name); }).map(function (a, k) {
    var mode = str(a.mode) || 'once';
    return {
      id: 'x' + k, name: str(a.name), desc: str(a.desc), detail: str(a.detail), unit: str(a.unit),
      price: num(a.price), perGuest: mode === 'guest', toggle: mode === 'once', max: num(a.max) || 2,
      img: safeUrl(a.image), pos: str(a.pos) || 'center'
    };
  });
  /* ---------- Letter-by-letter titles ---------- */
  function splitLetters(span, start) {
    var text = span.textContent;
    span.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var c = el('span', { class: 'mb-ch', style: 'animation-delay:' + (0.25 + (start + i) * 0.07).toFixed(2) + 's' });
      c.textContent = text[i];
      span.appendChild(c);
    }
  }
  function splitWords(span) {
    var k = 0;
    var words = span.textContent.trim().split(' ');
    span.textContent = '';
    words.forEach(function (w) {
      var ws = el('span', { class: 'mb-word' });
      w.split('').forEach(function (ch) {
        var c = el('span', { class: 'mb-ch', style: 'animation-delay:' + (0.15 + (k++) * 0.035).toFixed(3) + 's' });
        c.textContent = ch;
        ws.appendChild(c);
      });
      span.appendChild(ws);
    });
  }
  document.querySelectorAll('[data-letters]').forEach(function (s) { splitLetters(s, Number(s.getAttribute('data-letters'))); });
  document.querySelectorAll('[data-words]').forEach(splitWords);

  /* ---------- Loading screen ---------- */
  var loader = $('mb-loader');
  var wait = Math.max(150, 2900 - (Date.now() - t0));
  setTimeout(function () {
    loader.classList.add('is-fading');
    $('mb-hero').classList.add('mb-go');
  }, wait);
  setTimeout(function () { loader.hidden = true; lockPage(false); }, wait + 800);

  /* ---------- Phone "back" closes pop-ups instead of leaving the page ---------- */
  var layers = []; // stack of close functions, one per open pop-up
  try { history.scrollRestoration = 'manual'; } catch (err) {}
  var savedY = [];
  function pushLayer(close) {
    layers.push(close);
    savedY.push(window.scrollY);
    try { history.pushState({ mbLayer: layers.length }, ''); } catch (err) {}
  }
  function popLayer() {
    // closing from a button: step browser history back; popstate does the closing
    if (history.state && history.state.mbLayer) history.back();
    else { var f = layers.pop(); if (f) runClose(f); }
  }
  function runClose(f) {
    var y = savedY.pop();
    f();
    // stay exactly where the visitor was before opening the photo
    if (typeof y === 'number') window.scrollTo({ top: y, behavior: 'instant' });
  }
  window.addEventListener('popstate', function () {
    var f = layers.pop();
    if (f) runClose(f);
  });

  /* ---------- Lightbox ---------- */
  var lb = $('mb-lightbox'), lbIdx = -1, lbReturn = null, lbList = PHOTOS;
  function lbShow(i) {
    var n = lbList.length;
    if (!n) return;
    lbIdx = (i + n) % n;
    var p = lbList[lbIdx], img = $('mb-lb-img');
    img.src = p.src; img.alt = p.alt;
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    $('mb-lb-cap').textContent = p.caption;
    $('mb-lb-count').textContent = (lbIdx + 1) + ' / ' + n;
  }
  function lbOpen(list, i) {
    lbReturn = document.activeElement;
    lbList = list;
    lbShow(i);
    lb.hidden = false; lockPage(true); lb.focus();
    pushLayer(lbHide);
  }
  function lbHide() {
    if (lb.hidden) return;
    lb.hidden = true; lbIdx = -1; lockPage(false);
    if (lbReturn && lbReturn.focus) lbReturn.focus({ preventScroll: true });
  }
  function lbClose() { if (!lb.hidden) popLayer(); }
  lb.addEventListener('click', lbClose);
  $('mb-lb-fig').addEventListener('click', function (e) { e.stopPropagation(); });
  $('mb-lb-close').addEventListener('click', function (e) { e.stopPropagation(); lbClose(); });
  $('mb-lb-prev').addEventListener('click', function (e) { e.stopPropagation(); lbShow(lbIdx - 1); });
  $('mb-lb-next').addEventListener('click', function (e) { e.stopPropagation(); lbShow(lbIdx + 1); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
    else if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
  });
  // swipe on phones
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx == null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) lbShow(lbIdx + (dx < 0 ? 1 : -1));
  });

  function zoomButton(p, list, idx, pos) {
    var b = el('button', { type: 'button', class: 'mb-zoom', 'aria-label': 'View photo: ' + p.caption });
    var img = el('img', { src: p.src, alt: p.alt, loading: 'lazy', style: 'width:100%;height:100%;object-fit:cover;object-position:' + pos + ';display:block' });
    b.appendChild(img);
    b.addEventListener('click', function () { lbOpen(list, idx); });
    return b;
  }

  /* ---------- Gallery ---------- */
  var gal = $('mb-gallery');
  PHOTOS.forEach(function (p, i) {
    var f = el('figure', { class: p.tall ? 'mb-tall' : null, style: 'margin:0;position:relative;overflow:hidden;border-radius:4px' });
    f.appendChild(zoomButton(p, PHOTOS, i, p.pos || 'center'));
    var cap = el('figcaption', { style: 'position:absolute;left:0;right:0;bottom:0;padding:32px 16px 14px;background:linear-gradient(180deg,rgba(20,12,6,0) 0%,rgba(20,12,6,.7) 100%);color:#FBF6EF;font-size:13px;font-weight:600;letter-spacing:.04em;pointer-events:none' });
    cap.textContent = p.caption;
    f.appendChild(cap);
    gal.appendChild(f);
  });

  /* ---------- Photo slider ---------- */
  var car = $('mb-carousel'), slideCur = 0;
  SLIDE_PHOTOS.forEach(function (p, k) {
    var f = el('figure', { style: 'margin:0;position:relative;flex:0 0 86%;aspect-ratio:7/10;scroll-snap-align:start;border-radius:16px;overflow:hidden;box-shadow:0 2px 4px rgba(58,36,24,.08),0 26px 50px -24px rgba(58,36,24,.5)' });
    f.appendChild(zoomButton(p, SLIDE_PHOTOS, k, p.pos));
    f.appendChild(el('figcaption', { style: 'position:absolute;left:0;right:0;bottom:0;padding:48px 22px 20px;background:linear-gradient(180deg,rgba(20,12,6,0) 0%,rgba(20,12,6,.72) 100%);color:#FBF6EF;pointer-events:none' },
      '<span style="display:block;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;opacity:.85">' + pad2(k + 1) + '</span>' +
      '<span style="display:block;margin-top:4px;font-family:\'Cormorant Garamond\',serif;font-size:26px;font-style:italic;line-height:1.15">' + esc(p.caption) + '</span>'));
    car.appendChild(f);
  });
  function slideW() { var f = car.querySelector('figure'); return f ? f.getBoundingClientRect().width + 16 : car.clientWidth; }
  function slideUpdate() {
    var total = Math.max(1, SLIDE_PHOTOS.length);
    var k = Math.round(car.scrollLeft / slideW());
    if (car.scrollLeft + car.clientWidth >= car.scrollWidth - 4) k = total - 1;
    k = Math.min(Math.max(k, 0), total - 1);
    if (k === slideCur && $('mb-sl-count').textContent) return;
    slideCur = k;
    $('mb-sl-count').textContent = pad2(k + 1) + ' / ' + pad2(total);
    $('mb-sl-bar').style.width = ((k + 1) / total * 100).toFixed(2) + '%';
  }
  car.addEventListener('scroll', slideUpdate, { passive: true });
  $('mb-sl-prev').addEventListener('click', function () { car.scrollBy({ left: -slideW(), behavior: 'smooth' }); });
  $('mb-sl-next').addEventListener('click', function () { car.scrollBy({ left: slideW(), behavior: 'smooth' }); });
  $('mb-sl-count').textContent = '';
  slideUpdate();

  /* ---------- 360° tour ---------- */
  (function () {
    var box = $('mb-tour'), img = box.querySelector('.mb-tour-img');
    var IW = 1672, IH = 756;
    var t = { x: 0, y: 0, z: 1, base: 1, minX: 0, drag: false, idleUntil: 0, dir: -1, ready: false, full: false };
    function apply() {
      var S = t.base * t.z, bw = box.clientWidth, bh = box.clientHeight;
      t.minX = Math.min(0, bw - IW * S);
      t.x = Math.min(0, Math.max(t.minX, t.x));
      t.y = Math.min(0, Math.max(Math.min(0, bh - IH * S), t.y));
      img.style.transform = 'translate3d(' + t.x.toFixed(2) + 'px,' + t.y.toFixed(2) + 'px,0) scale(' + S.toFixed(4) + ')';
    }
    function layout(center) {
      if (!t.ready) return;
      var bw = box.clientWidth, bh = box.clientHeight, prevS = t.base * t.z;
      var cx = (bw / 2 - t.x) / prevS, cy = (bh / 2 - t.y) / prevS;
      t.base = Math.max(bh * 1.12 / IH, bw / IW);
      var S = t.base * t.z;
      if (center) { t.x = (bw - IW * S) / 2; t.y = (bh - IH * S) / 2; }
      else { t.x = bw / 2 - cx * S; t.y = bh / 2 - cy * S; }
      apply();
    }
    function zoom(f) {
      if (!t.ready) return;
      var bw = box.clientWidth, bh = box.clientHeight, S0 = t.base * t.z;
      var cx = (bw / 2 - t.x) / S0, cy = (bh / 2 - t.y) / S0;
      t.z = Math.min(2.6, Math.max(1, t.z * f));
      var S1 = t.base * t.z;
      t.x = bw / 2 - cx * S1; t.y = bh / 2 - cy * S1;
      t.idleUntil = Date.now() + 5000;
      apply();
    }
    function auto() {
      if (reduced) return;
      (function step() {
        if (t.ready && !t.drag && Date.now() > t.idleUntil) {
          t.x += t.dir * 0.35;
          if (t.x <= t.minX) t.dir = 1;
          if (t.x >= 0) t.dir = -1;
          apply();
        }
        requestAnimationFrame(step);
      })();
    }
    function setFull(on) {
      if (on === t.full) return;
      if (on) pushLayer(function () { applyFull(false); });
      else { popLayer(); return; }
      applyFull(true);
    }
    function applyFull(on) {
      if (on === t.full) return;
      t.full = on;
      box.classList.toggle('mb-tour-full', on);
      $('mb-tour-full').setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
      lockPage(on);
      requestAnimationFrame(function () { requestAnimationFrame(function () { layout(false); }); });
    }
    function go() {
      // works with any panorama size: read the real photo dimensions
      IW = img.naturalWidth || IW; IH = img.naturalHeight || IH;
      img.style.width = IW + 'px'; img.style.height = IH + 'px';
      t.ready = true; layout(true); auto();
    }
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go);
    window.addEventListener('resize', function () { layout(false); });

    box.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      t.drag = true; t.px = e.clientX; t.py = e.clientY; box.style.cursor = 'grabbing';
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
    });
    box.addEventListener('pointermove', function (e) {
      if (!t.drag) return;
      t.x += e.clientX - t.px; t.y += e.clientY - t.py; t.px = e.clientX; t.py = e.clientY;
      apply();
    });
    var up = function () { if (!t.drag) return; t.drag = false; t.idleUntil = Date.now() + 3500; box.style.cursor = 'grab'; };
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setFull(false);
      else if (e.key === 'ArrowLeft') { t.x += 60; t.idleUntil = Date.now() + 3500; apply(); }
      else if (e.key === 'ArrowRight') { t.x -= 60; t.idleUntil = Date.now() + 3500; apply(); }
    });
    $('mb-tour-in').addEventListener('click', function () { zoom(1.25); });
    $('mb-tour-out').addEventListener('click', function () { zoom(0.8); });
    $('mb-tour-full').addEventListener('click', function () { setFull(!t.full); });
  })();

  /* ---------- Add to your stay ---------- */
  var st = { ci: '', co: '', g: 2, q: {}, ex: '' };
  var ICON_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
  var ICON_MINUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"></path></svg>';
  var ICON_PLUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12M12 6v12"></path></svg>';
  var ICON_ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"></path></svg>';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var nice = function (d) { var p = d.split('-'); return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0]; };
  var now = new Date();
  var today = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());

  function calc() {
    var nights = 0;
    if (st.ci && st.co) nights = Math.round((Date.parse(st.co + 'T00:00:00Z') - Date.parse(st.ci + 'T00:00:00Z')) / 86400000);
    var dateError = !!(st.ci && st.co && nights <= 0);
    if (nights < 0) nights = 0;
    var longStay = nights >= LONG_MIN;
    var rate = longStay ? LONG_STAY_RATE : STANDARD_RATE;
    var room = nights > 0 && rate != null ? rate * nights : null;
    var unpriced = false, extrasTotal = 0, lines = [];
    var items = ADDONS.map(function (a, k) {
      var cap = a.perGuest ? st.g : (a.max || 1);
      var qty = Math.min(st.q[a.id] || 0, a.toggle ? 1 : cap);
      if (qty > 0) {
        var amount = a.price != null ? a.price * qty : null;
        if (amount == null) unpriced = true; else extrasTotal += amount;
        lines.push({ label: a.name + (a.toggle ? '' : ' × ' + qty), amount: amount != null ? fmt(amount) : 'On request' });
      }
      var ask = ['Hello Mula Bali, I have a question about the ' + a.name + ' before booking.'];
      if (st.ci && st.co && nights > 0) ask.push('My dates: ' + nice(st.ci) + ' – ' + nice(st.co) + ', ' + st.g + ' guests.');
      return { a: a, k: k, cap: cap, qty: qty, on: qty > 0, ask: waLink(ask.join('\n')) };
    });
    return { nights: nights, dateError: dateError, longStay: longStay, room: room, unpriced: unpriced, extrasTotal: extrasTotal, lines: lines, items: items };
  }
  function setQ(id, v) { st.q[id] = v; render(); }

  function controls(it) {
    var a = it.a, wrap = document.createDocumentFragment();
    if (a.toggle) {
      var b = el('button', { type: 'button', class: 'mb-ex-add', 'aria-pressed': String(it.on), 'data-act': 'flip', 'data-id': a.id }, (it.on ? ICON_CHECK : '') + (it.on ? 'Added' : 'Add'));
      wrap.appendChild(b);
    } else {
      wrap.appendChild(el('div', { class: 'mb-step mb-step-sm', role: 'group', 'aria-label': a.name + ' quantity' },
        '<button type="button" data-act="dec" data-id="' + a.id + '" aria-label="Remove one">' + ICON_MINUS + '</button>' +
        '<span aria-live="polite">' + it.qty + '</span>' +
        '<button type="button" data-act="inc" data-id="' + a.id + '" aria-label="Add one">' + ICON_PLUS + '</button>'));
    }
    return wrap;
  }

  var list = $('mb-addons');
  var cards = {};
  ADDONS.forEach(function (a, k) {
    var art = el('article', { class: 'mb-addon' });
    art.innerHTML =
      '<button type="button" class="mb-addon-media" data-act="view" data-id="' + a.id + '" aria-label="View details: ' + esc(a.name) + '">' +
      '<img src="' + a.img + '" alt="" loading="lazy" style="object-position:' + (a.pos || 'center') + '">' +
      '<span class="mb-addon-num">' + pad2(k + 1) + '</span><span class="mb-addon-badge">Added</span>' +
      '<span class="mb-addon-view">View details' + ICON_ARROW + '</span></button>' +
      '<div class="mb-addon-body">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><p class="mb-ex-unit">' + esc(a.unit) + '</p><p class="mb-ex-price">' + (a.price != null ? fmt(a.price) : 'On request') + '</p></div>' +
      '<h3 style="margin:10px 0 6px;font-family:\'Cormorant Garamond\',serif;font-weight:600;font-size:25px;line-height:1.15;color:#2E1C12">' + esc(a.name) + '</h3>' +
      '<p style="margin:0 0 20px;font-size:14px;color:#5A4334;flex-grow:1">' + esc(a.desc) + '</p>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><span data-ctl></span>' +
      '<a class="mb-ask" target="_blank" rel="noopener" aria-label="Ask about ' + esc(a.name) + ' on WhatsApp"><img src="img/whatsapp.png" alt="" width="18" height="18">Ask first</a></div>' +
      '</div>';
    list.appendChild(art);
    cards[a.id] = art;
  });

  function handleAct(e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var id = b.getAttribute('data-id'), act = b.getAttribute('data-act');
    var it = calc().items.filter(function (x) { return x.a.id === id; })[0];
    if (!it) return;
    if (act === 'flip') setQ(id, it.on ? 0 : 1);
    else if (act === 'inc') setQ(id, Math.min(it.cap, it.qty + 1));
    else if (act === 'dec') setQ(id, Math.max(0, it.qty - 1));
    else if (act === 'view') exdOpen(id);
  }
  list.addEventListener('click', handleAct);

  // Detail pop-up
  var exd = $('mb-exd'), exdReturn = null;
  function exdOpen(id) {
    exdReturn = document.activeElement;
    st.ex = id; render();
    exd.hidden = false; lockPage(true); exd.focus();
    pushLayer(exdHide);
  }
  function exdHide() {
    if (exd.hidden) return;
    exd.hidden = true; st.ex = ''; lockPage(false);
    if (exdReturn && exdReturn.focus) exdReturn.focus({ preventScroll: true });
  }
  function exdClose() { if (!exd.hidden) popLayer(); }
  exd.addEventListener('click', function (e) {
    if (e.target.closest('[data-exd-close]') || !e.target.closest('#mb-exd-card')) { exdClose(); return; }
    var act = e.target.closest('[data-act]');
    var key = act ? act.getAttribute('data-act') : null;
    handleAct(e);
    // keep keyboard focus on the same control after re-render
    var again = key && exd.querySelector('[data-act="' + key + '"]');
    if (again) again.focus(); else if (!exd.hidden && !exd.contains(document.activeElement)) exd.focus();
  });
  document.addEventListener('keydown', function (e) { if (!exd.hidden && e.key === 'Escape') exdClose(); });

  // Stay inputs
  var ciIn = $('mb-ci'), coIn = $('mb-co');
  ciIn.min = today; coIn.min = today;
  ciIn.addEventListener('change', function () { st.ci = ciIn.value; render(); });
  coIn.addEventListener('change', function () { st.co = coIn.value; render(); });
  $('mb-g-inc').addEventListener('click', function () { st.g = Math.min(MAX_GUESTS, st.g + 1); render(); });
  $('mb-g-dec').addEventListener('click', function () { st.g = Math.max(1, st.g - 1); render(); });

  function render() {
    var c = calc();
    coIn.min = st.ci || today;
    $('mb-g').textContent = st.g;
    $('mb-date-error').hidden = !c.dateError;

    c.items.forEach(function (it) {
      var art = cards[it.a.id];
      art.className = it.on ? 'mb-addon is-on' : 'mb-addon';
      var ctl = art.querySelector('[data-ctl]');
      ctl.innerHTML = ''; ctl.appendChild(controls(it));
      art.querySelector('.mb-ask').href = it.ask;
    });

    // Summary
    $('mb-sum-dates').textContent = st.ci && st.co && c.nights > 0 ? nice(st.ci) + ' – ' + nice(st.co) : 'Not selected';
    $('mb-sum-g').textContent = st.g;
    var roomLabel = 'Villa', roomText = 'Select dates';
    if (c.nights > 0) {
      roomLabel = (c.longStay ? 'Long stay' : 'Villa') + ' · ' + c.nights + (c.nights === 1 ? ' night' : ' nights');
      roomText = c.room != null ? fmt(c.room) : 'Long-stay rate';
    }
    $('mb-sum-room-label').textContent = roomLabel;
    $('mb-sum-room').textContent = roomText;
    $('mb-sum-extras').hidden = !c.lines.length;
    $('mb-sum-lines').innerHTML = c.lines.map(function (l) {
      return '<div class="mb-sum-row mb-sum-sub"><span>' + esc(l.label) + '</span><span>' + esc(l.amount) + '</span></div>';
    }).join('');
    var total = '—', note = '';
    if (c.nights > 0) {
      if (c.room != null && !c.unpriced) total = fmt(c.room + c.extrasTotal);
      else { total = 'On request'; note = 'Some prices are confirmed by our team on WhatsApp.'; }
    }
    $('mb-sum-total').textContent = total;
    $('mb-sum-note').textContent = note;
    $('mb-sum-note').hidden = !note;
    var msg = ['Hello Mula Bali, I would like to request a booking.',
      'Check-in: ' + (st.ci ? nice(st.ci) : '-'),
      'Check-out: ' + (st.co ? nice(st.co) : '-'),
      'Nights: ' + (c.nights || '-'),
      'Guests: ' + st.g];
    if (c.lines.length) { msg.push('Add-ons:'); c.lines.forEach(function (l) { msg.push('- ' + l.label); }); }
    $('mb-sum-wa').href = waLink(msg.join('\n'));

    // Detail pop-up content
    var cur = c.items.filter(function (x) { return x.a.id === st.ex; })[0];
    if (cur) {
      var a = cur.a;
      $('mb-exd-img').src = a.img; $('mb-exd-img').alt = a.name; $('mb-exd-img').style.objectPosition = a.pos || 'center';
      $('mb-exd-num').textContent = pad2(cur.k + 1);
      $('mb-exd-title').textContent = a.name;
      $('mb-exd-desc').textContent = a.desc;
      $('mb-exd-detail').textContent = a.detail;
      $('mb-exd-detail').hidden = !a.detail;
      $('mb-exd-price').textContent = a.price != null ? fmt(a.price) : 'Price on request';
      $('mb-exd-unit').textContent = a.unit;
      var acts = $('mb-exd-actions');
      acts.innerHTML = '';
      if (a.toggle) {
        acts.appendChild(el('button', { type: 'button', class: 'mb-ex-add mb-ex-add-lg', 'aria-pressed': String(cur.on), 'data-act': 'flip', 'data-id': a.id },
          (cur.on ? ICON_CHECK : '') + (cur.on ? 'Added to your stay' : 'Add to your stay')));
      } else {
        acts.appendChild(controls(cur));
      }
      var ask = el('a', { class: 'mb-exd-ask', href: cur.ask, target: '_blank', rel: 'noopener' }, '<img src="img/whatsapp.png" alt="" width="20" height="20">Ask on WhatsApp');
      acts.appendChild(ask);
    }
  }
  render();

  /* ---------- Back-to-top button ---------- */
  var topBtn = $('mb-top');
  var waBtn = document.querySelector('.mb-wa');
  var hero = $('top');
  function topCheck() {
    // both floating buttons stay hidden over the hero photo and appear once the visitor scrolls on
    var past = window.scrollY > Math.min(hero.offsetHeight, window.innerHeight) * 0.6;
    topBtn.classList.toggle('is-shown', past);
    waBtn.classList.toggle('is-shown', past);
  }
  window.addEventListener('scroll', topCheck, { passive: true });
  topCheck();
  topBtn.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    topBtn.blur();
  });

  /* ---------- Scroll reveal ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.mb-reveal'));
  if (typeof IntersectionObserver === 'undefined') {
    reveals.forEach(function (r) { r.classList.add('mb-go'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('mb-go'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (r) { io.observe(r); });
  }
  } // end start()
})();
