(function () {
  // Tryb diagnostyczny: dodaj ?debug=1 do adresu, zeby zobaczyc bledy i obslugiwane funkcje
  // (przydatne w przegladarkach wbudowanych w aplikacje, np. Messenger, ktore nie maja konsoli).
  if (/[?&]debug\b/.test(location.search)) {
    var dbg = document.createElement('pre');
    dbg.style.cssText = 'position:fixed;left:0;right:0;top:0;max-height:50vh;overflow:auto;margin:0;padding:10px;background:#111;color:#9f9;font:11px/1.4 monospace;z-index:99999;white-space:pre-wrap;word-break:break-all';
    document.body.appendChild(dbg);
    window.__dlog = function (m) { dbg.textContent += m + '\n'; };
    var sup = function (p, v) { try { return window.CSS && CSS.supports ? CSS.supports(p, v) : 'n/a'; } catch (e) { return 'err'; } };
    __dlog('UA: ' + navigator.userAgent);
    __dlog('okno: ' + innerWidth + 'x' + innerHeight + ', dpr ' + (window.devicePixelRatio || 1) + ', hover:none=' + matchMedia('(hover:none)').matches);
    __dlog('JS: scrollTo=' + typeof Element.prototype.scrollTo + ' IO=' + typeof window.IntersectionObserver + ' rAF=' + typeof window.requestAnimationFrame + ' mql.addEventListener=' + typeof matchMedia('(max-width:800px)').addEventListener);
    __dlog('CSS: snap=' + sup('scroll-snap-type', 'x mandatory') + ' aspect-ratio=' + sup('aspect-ratio', '1/1') + ' inset=' + sup('inset', '0') + ' gap(flex)=' + sup('gap', '1px'));
    window.addEventListener('error', function (e) { __dlog('BLAD: ' + e.message + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno); });
    document.addEventListener('click', function (e) {
      var t = e.target;
      __dlog('klik: ' + (t.tagName || '') + '.' + (typeof t.className === 'string' ? t.className : ''));
    }, true);
    document.addEventListener('touchstart', function (e) {
      var t = e.target;
      __dlog('dotyk: ' + (t.tagName || '') + '.' + (typeof t.className === 'string' ? t.className : ''));
    }, { passive: true, capture: true });
  }
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var calm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  try {
  if (fine && !calm && !window.matchMedia('(max-width:800px)').matches && 'IntersectionObserver' in window) {
    var items = document.querySelectorAll('.card, .step, .section-head, .quote, .contact-box, .faq details');
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }
  } catch (e0) { if (window.__dlog) __dlog('BLAD (reveal): ' + e0.message); }

  try {
  document.querySelectorAll('.faq details').forEach(function (d) {
    var sum = d.querySelector('summary');
    var body = d.querySelector('p');
    var anim = null;
    var fullPad = parseFloat(getComputedStyle(body).paddingBottom) || 0;
    if (d.open) d.classList.add('is-open');
    sum.addEventListener('click', function (e) {
      if (calm || !body.animate) { d.classList.toggle('is-open', !d.open); return; }
      e.preventDefault();
      var cs = getComputedStyle(body);
      var cur = body.getBoundingClientRect().height;
      var curPad = parseFloat(cs.paddingBottom) || 0;
      var curOp = parseFloat(cs.opacity);
      var wasAnimating = !!anim;
      if (anim) anim.cancel();
      var opening = !d.classList.contains('is-open');
      if (opening) { d.open = true; d.classList.add('is-open'); }
      else { d.classList.remove('is-open'); }
      var h = body.scrollHeight;
      // animujemy tez padding-bottom: przy border-box sama wysokosc 0 zostawia padding i na koncu daje skok (scinka)
      var mine = body.animate(
        {
          height: opening ? [(wasAnimating ? cur : 0) + 'px', h + 'px'] : [cur + 'px', '0px'],
          paddingBottom: opening ? [(wasAnimating ? curPad : 0) + 'px', fullPad + 'px'] : [curPad + 'px', '0px'],
          opacity: opening ? [wasAnimating ? curOp : 0, 1] : [curOp, 0]
        },
        { duration: 300, easing: 'ease', fill: 'forwards' }
      );
      anim = mine;
      var finished = false;
      function done() {
        if (finished) return;
        finished = true;
        if (!opening && !d.classList.contains('is-open')) d.open = false;
        mine.cancel();
        if (anim === mine) anim = null;
      }
      mine.onfinish = done;
      setTimeout(done, 330);
    });
  });
  } catch (e1) { if (window.__dlog) __dlog('BLAD (faq): ' + e1.message); }

  // Widget pomocy w prawym dolnym rogu (wzor z Pasta e Toro): panel z szybkimi linkami
  var helpToggle = document.getElementById('helpToggle');
  var helpPanel = document.getElementById('helpPanel');
  if (helpToggle && helpPanel) {
    var setHelp = function (open) {
      helpPanel.classList.toggle('open', open);
      helpToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    helpToggle.addEventListener('click', function () { setHelp(!helpPanel.classList.contains('open')); });
    helpPanel.addEventListener('click', function (e) { if (e.target.closest('a')) setHelp(false); });
    document.addEventListener('click', function (e) { if (!e.target.closest('#helpWidget')) setHelp(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setHelp(false); });
  }

  // Slidery na telefonie (do 800 px): petla (klony), scroll-snap, strzalki, kropki.
  // Animacja (skala, przezroczystosc) jest na ELEMENCIE WEWNATRZ slajdu, a nie na slajdzie,
  // bo transform na elemencie z scroll-snap zmienia punkty zatrzasku i pasek "wraca" (nie dalo sie przesuwac).
  var mqSlider = window.matchMedia('(max-width:800px)');
  document.querySelectorAll('.cards, .process, .media').forEach(function (track) {
   try {
    var items = Array.prototype.slice.call(track.children);
    var n = items.length;
    if (n < 2) return;
    var wrap = document.createElement('div');
    wrap.className = 'slider';
    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track);
    track.classList.add('slider-track');
    var ui = document.createElement('div');
    ui.className = 'slider-ui';
    ui.innerHTML = '<button type="button" class="s-btn prev" aria-label="Poprzedni">&#8249;</button><div class="s-dots"></div><button type="button" class="s-btn next" aria-label="Następny">&#8250;</button>';
    wrap.appendChild(ui);
    var dotsEl = ui.querySelector('.s-dots');
    // "Jak pracuje" to proces (kroki 1 do 4), a nie petla: bez klonow, na koncu strzalka cofa na poczatek
    var loop = !track.classList.contains('process');
    var dots = items.map(function (_, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 's-dot';
      d.setAttribute('aria-label', 'Element ' + (i + 1) + ' z ' + n);
      d.addEventListener('click', function () {
        if (!loop) { go(i, true); return; }
        var delta = (((i - (cur % n)) % n) + n) % n;
        if (delta > n / 2) delta -= n;
        go(target + delta, true);
      });
      dotsEl.appendChild(d);
      return d;
    });
    var built = false, slides = [], orig = [], cur = 0, target = 0, padL = 0, tick = 0, settle = 0;

    function leftOf(g) { return slides[g].offsetLeft - padL; }
    function nearest() {
      var s = track.scrollLeft, best = 0, bd = 1e9;
      for (var k = 0; k < slides.length; k++) {
        var d = Math.abs(leftOf(k) - s);
        if (d < bd) { bd = d; best = k; }
      }
      return best;
    }
    function setActive(g) {
      cur = g;
      var i = ((g % n) + n) % n;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === g); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }
    // Przejscie strzalek/kropek (technika FLIP): pasek przeskakuje od razu na cel, a zawartosc
    // plynnie "dojezdza" animacja transform (GPU, bez pracy skryptu w kazdej klatce, wiec bez klatkowania).
    // Transform jest na elemencie WEWNATRZ slajdu, nie na slajdzie zatrzaskujacym (scroll-snap).
    var flipping = false, flipTimer = 0;
    function clearFlip() {
      if (flipTimer) { clearTimeout(flipTimer); flipTimer = 0; }
      track.style.scrollSnapType = '';
      if (flipping) {
        flipping = false;
        slides.forEach(function (s) {
          var el = s.firstElementChild;
          if (el) { el.style.transition = ''; el.style.transform = ''; }
        });
      }
    }
    function animateTo(x) {
      clearFlip();
      var before = track.scrollLeft;
      track.style.scrollSnapType = 'none';
      track.scrollLeft = x;
      var dist = track.scrollLeft - before;
      if (Math.abs(dist) < 1) { track.style.scrollSnapType = ''; return; }
      var inners = slides.map(function (s) { return s.firstElementChild; });
      inners.forEach(function (el) { el.style.transition = 'none'; el.style.transform = 'translate3d(' + dist + 'px,0,0)'; });
      void track.offsetWidth;
      flipping = true;
      var dur = Math.abs(dist) > 450 ? 850 : 620;
      inners.forEach(function (el) { el.style.transition = 'transform ' + dur + 'ms cubic-bezier(.45,0,.2,1)'; el.style.transform = 'translate3d(0,0,0)'; });
      flipTimer = setTimeout(function () { flipTimer = 0; clearFlip(); normalize(); }, dur + 40);
    }
    function go(g, smooth) {
      target = g;
      if (smooth && !calm) { animateTo(leftOf(g)); }
      else { clearFlip(); track.scrollLeft = leftOf(g); }
    }
    track.addEventListener('touchstart', clearFlip, { passive: true });
    track.addEventListener('wheel', clearFlip, { passive: true });
    // po zatrzymaniu przewijania: jesli jestesmy w zestawie klonow, przeskocz (niewidocznie) do oryginalow
    function normalize() {
      if (!built || flipping) return;
      var g = nearest();
      if (loop && (g < n || g >= 2 * n)) {
        var gg = g < n ? g + n : g - n;
        var shift = leftOf(gg) - leftOf(g);
        track.scrollLeft = track.scrollLeft + shift;
        g = gg;
      }
      target = g;
      setActive(g);
    }
    function onScroll() {
      if (!built) return;
      clearTimeout(settle);
      settle = setTimeout(normalize, 140);
      if (tick) return;
      tick = setTimeout(function () { tick = 0; if (built) setActive(nearest()); }, 40);
    }
    function cloneSlide(s) {
      var c = s.cloneNode(true);
      c.classList.add('is-clone');
      c.classList.remove('is-active');
      c.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(c.querySelectorAll('a, button'), function (el) { el.setAttribute('tabindex', '-1'); });
      return c;
    }
    function build() {
      orig = items.map(function (it) {
        var s = document.createElement('div');
        s.className = 'slide';
        track.insertBefore(s, it);
        s.appendChild(it);
        return s;
      });
      var before = loop ? orig.map(cloneSlide) : [], after = loop ? orig.map(cloneSlide) : [];
      before.forEach(function (c) { track.insertBefore(c, orig[0]); });
      after.forEach(function (c) { track.appendChild(c); });
      slides = before.concat(orig, after);
      built = true;
      padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      var start0 = loop ? n : 0;
      go(start0, false);
      setActive(start0);
    }
    function destroy() {
      built = false;
      slides.forEach(function (s) { if (s.classList.contains('is-clone')) s.remove(); });
      orig.forEach(function (s, i) { track.insertBefore(items[i], s); s.remove(); });
      slides = []; orig = [];
      track.scrollLeft = 0;
    }
    function sync() {
      if (mqSlider.matches) { if (!built) build(); } else if (built) { destroy(); }
    }
    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('scrollend', normalize);
    // gdyby budowa petli sie nie udala: strzalki dalej przewijaja zwykly, natywny pasek
    ui.querySelector('.prev').addEventListener('click', function () { if (built) { var g = target - 1; if (!loop && g < 0) g = n - 1; go(g, true); } else { track.scrollLeft -= track.clientWidth * 0.84; } });
    ui.querySelector('.next').addEventListener('click', function () { if (built) { var g = target + 1; if (!loop && g > n - 1) g = 0; go(g, true); } else { track.scrollLeft += track.clientWidth * 0.84; } });
    if (mqSlider.addEventListener) { mqSlider.addEventListener('change', sync); } else if (mqSlider.addListener) { mqSlider.addListener(sync); }
    var rz = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        if (!built) return;
        padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        go(cur, false);
      }, 150);
    });
    sync();
    if (window.__dlog) { __dlog('slider ' + track.className + ': ' + (built ? 'zbudowany, slajdow ' + slides.length : 'NIE zbudowany') + ', scrollWidth=' + track.scrollWidth + ' clientWidth=' + track.clientWidth); }
   } catch (err) {
    if (window.__dlog) { __dlog('BLAD slidera: ' + err.message); }
    if (window.console && console.error) { console.error(err); }
    // awaria budowy petli: wyczysc klony i opakowania, zostaw dzialajacy natywny pasek (swipe)
    built = false;
    Array.prototype.slice.call(track.children).forEach(function (c) {
      if (c.classList.contains('is-clone')) { track.removeChild(c); }
      else if (c.classList.contains('slide')) { while (c.firstChild) { track.insertBefore(c.firstChild, c); } track.removeChild(c); }
    });
   }
  });

  // Czysty adres: klikniecia w odnosniki #sekcja i w logo przewijaja strone, ale NIE dopisuja #hasha do paska adresu.
  // Bez JS odnosniki dalej dzialaja (zwykle kotwice).
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href^="#"], a[href="./"]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    var behavior = calm ? 'auto' : 'smooth';
    if (href === './') {
      if (a.pathname !== location.pathname) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: behavior });
    } else {
      var id = href.slice(1);
      var t = id ? document.getElementById(id) : null;
      if (id && !t) return;
      e.preventDefault();
      if (!t || id === 'top' || id === 'start') { window.scrollTo({ top: 0, behavior: behavior }); }
      else {
        t.scrollIntoView({ behavior: behavior, block: 'start' });
        t.setAttribute('tabindex', '-1');
        t.focus({ preventScroll: true });
      }
    }
    if (location.hash && window.history && history.replaceState) { history.replaceState(null, '', location.pathname + location.search); }
  });

  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var backdrop = document.getElementById('backdrop');
  var closeBtn = document.getElementById('drawer-close');
  if (!burger || !drawer || !backdrop) return;

  function setOpen(open) {
    drawer.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) { closeBtn.focus(); } else { burger.focus({ preventScroll: true }); }
  }

  burger.addEventListener('click', function () { setOpen(true); });
  closeBtn.addEventListener('click', function () { setOpen(false); });
  backdrop.addEventListener('click', function () { setOpen(false); });
  drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) { drawer.classList.remove('open'); backdrop.classList.remove('open'); document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); drawer.setAttribute('aria-hidden', 'true'); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) setOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && drawer.classList.contains('open')) setOpen(false);
  });
})();
