(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hlavní jistič ---------- */
  var sw = document.getElementById('main-switch');
  var hint = document.getElementById('board-hint');
  function setPower(on, announce) {
    root.classList.toggle('power-on', on);
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    if (announce) hint.textContent = on ? 'Nahozeno – vedení je pod proudem.' : 'Vypnuto. Nahoďte jistič páčkou nahoru.';
  }
  sw.addEventListener('click', function () { setPower(!root.classList.contains('power-on'), true); });
  // úvodní „cvak“: stránka se po načtení sama nahodí
  if (reduce) setPower(true, false);
  else setTimeout(function () { setPower(true, false); }, 650);

  /* ---------- Vedení přes celou stránku ---------- */
  var trunk = document.querySelector('.trunk');
  var main = document.getElementById('obsah');
  var hero = document.querySelector('.hero');
  var nodes = [];
  function layoutTrunk() {
    if (!trunk || getComputedStyle(trunk).display === 'none') return false;
    var top = hero.offsetHeight;
    trunk.style.setProperty('--trunk-top', top + 'px');
    nodes.forEach(function (n) { n.el.remove(); });
    nodes = [];
    var tTop = trunk.getBoundingClientRect().top;
    document.querySelectorAll('[data-node]').forEach(function (sec) {
      var h = sec.querySelector('h2');
      var r = h.getBoundingClientRect();
      var y = r.top + r.height / 2 - tTop;
      var el = document.createElement('span');
      el.className = 'trunk-node' + (sec.classList.contains('section-dark') ? ' on-dark' : '');
      el.style.top = y + 'px';
      trunk.appendChild(el);
      nodes.push({ el: el, y: y });
    });
    return true;
  }
  function updateTrunk() {
    if (!nodes.length) return;
    var rect = trunk.getBoundingClientRect();
    var reach = reduce ? rect.height : (window.innerHeight * 0.55 - rect.top);
    var f = Math.max(0, Math.min(1, reach / rect.height));
    trunk.style.setProperty('--fill', f.toFixed(4));
    nodes.forEach(function (n) { n.el.classList.toggle('lit', n.y <= reach); });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; updateTrunk(); });
  }
  function relayout() { if (layoutTrunk()) updateTrunk(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  relayout();

  /* ---------- Jemné objevení sekcí ---------- */
  var revealEls = document.querySelectorAll('.section-head, .panel, .line-steps, .order, .plate');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  /* ---------- Poptávka ---------- */
  var form = document.getElementById('poptavka-form');
  var status = document.getElementById('form-status');
  var stamp = document.getElementById('slip-stamp');
  var modules = document.querySelectorAll('.module[data-service]');
  if (!form) return;

  function setSlip(key, value) {
    var dd = document.querySelector('[data-slip="' + key + '"]');
    if (!dd) return;
    var v = (value || '').trim() || ' ';
    if (dd.textContent === v) return;
    dd.textContent = v;
    if (!reduce) {
      dd.classList.add('flash');
      requestAnimationFrame(function () { requestAnimationFrame(function () { dd.classList.remove('flash'); }); });
    }
  }
  function syncSlip() {
    setSlip('jmeno', form.jmeno.value);
    setSlip('telefon', form.telefon.value);
    var typ = form.querySelector('input[name="typ"]:checked');
    var misto = form.querySelector('input[name="misto"]:checked');
    setSlip('typ', typ ? typ.value : '');
    setSlip('misto', misto ? misto.value : '');
    setSlip('popis', form.popis.value);
    // jistič vybrané služby v rozvaděči je nahozený
    modules.forEach(function (m) { m.classList.toggle('on', !!typ && m.getAttribute('data-service') === typ.value); });
  }
  form.addEventListener('input', function () { syncSlip(); stamp.hidden = true; status.textContent = ''; });
  form.addEventListener('change', syncSlip);
  syncSlip();

  document.querySelectorAll('[data-preselect]').forEach(function (link) {
    link.addEventListener('click', function () {
      var radio = form.querySelector('input[name="typ"][value="' + link.getAttribute('data-preselect') + '"]');
      if (radio) { radio.checked = true; syncSlip(); }
      setTimeout(function () { form.jmeno.focus({ preventScroll: true }); }, reduce ? 0 : 450);
    });
  });

  var rules = {
    jmeno: function (v) { return v.trim().length > 0; },
    telefon: function (v) { return v.replace(/\D/g, '').length >= 9; },
    email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
  };
  var errIds = { jmeno: 'e-jmeno', telefon: 'e-tel', email: 'e-email' };
  function check(name) {
    var ok = rules[name](form[name].value);
    form[name].setAttribute('aria-invalid', ok ? 'false' : 'true');
    document.getElementById(errIds[name]).hidden = ok;
    return ok;
  }
  Object.keys(rules).forEach(function (name) {
    form[name].addEventListener('blur', function () {
      if (form[name].value || form[name].getAttribute('aria-invalid') === 'true') check(name);
    });
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var firstBad = null;
    Object.keys(rules).forEach(function (name) { if (!check(name) && !firstBad) firstBad = form[name]; });
    if (firstBad) {
      status.className = 'form-status bad';
      status.textContent = 'Zkontrolujte prosím zvýrazněná pole.';
      firstBad.focus();
      return;
    }
    syncSlip();
    stamp.hidden = false;
    status.className = 'form-status ok';
    status.textContent = 'Ukázka: nic se neodesílá.';
  });

  /* ---------- Mobil: schovat pevné „Zavolat“, když je číslo vidět jinde ---------- */
  var bar = document.getElementById('call-bar');
  if (bar && 'IntersectionObserver' in window) {
    var visible = new Set();
    var barIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
      bar.classList.toggle('is-off', visible.size > 0);
    }, { threshold: 0.15 });
    ['hero-call', 'poptavka-form', 'kontakt'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) barIo.observe(el);
    });
  }
})();
