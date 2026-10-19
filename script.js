(function () {
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var calm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (fine && !calm && 'IntersectionObserver' in window) {
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
