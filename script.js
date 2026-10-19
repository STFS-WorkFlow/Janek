(function () {
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var calm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
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
    var dots = items.map(function (_, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 's-dot';
      d.setAttribute('aria-label', 'Element ' + (i + 1) + ' z ' + n);
      d.addEventListener('click', function () {
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
    function go(g, smooth) {
      target = g;
      track.scrollTo({ left: leftOf(g), behavior: (smooth && !calm) ? 'smooth' : 'instant' });
    }
    // po zatrzymaniu przewijania: jesli jestesmy w zestawie klonow, przeskocz (niewidocznie) do oryginalow
    function normalize() {
      if (!built) return;
      var g = nearest();
      if (g < n || g >= 2 * n) {
        var gg = g < n ? g + n : g - n;
        var shift = leftOf(gg) - leftOf(g);
        track.scrollTo({ left: track.scrollLeft + shift, behavior: 'instant' });
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
      var before = orig.map(cloneSlide), after = orig.map(cloneSlide);
      before.forEach(function (c) { track.insertBefore(c, orig[0]); });
      after.forEach(function (c) { track.appendChild(c); });
      slides = before.concat(orig, after);
      built = true;
      padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      go(n, false);
      setActive(n);
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
    ui.querySelector('.prev').addEventListener('click', function () { if (built) go(target - 1, true); });
    ui.querySelector('.next').addEventListener('click', function () { if (built) go(target + 1, true); });
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
