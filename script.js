(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Jemné objevení sekcí */
  var revealEls = document.querySelectorAll('.section-head, .panel, .line-steps, .order, .contact');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  var form = document.getElementById('poptavka-form');
  var status = document.getElementById('form-status');
  var stamp = document.getElementById('slip-stamp');
  if (!form) return;

  /* Živý zakázkový list */
  function setSlip(key, value) {
    var dd = document.querySelector('[data-slip="' + key + '"]');
    if (!dd) return;
    var v = (value || '').trim();
    if (dd.textContent === (v || ' ')) return;
    dd.textContent = v || ' ';
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
  }
  form.addEventListener('input', function () { syncSlip(); stamp.hidden = true; status.textContent = ''; });
  form.addEventListener('change', syncSlip);

  /* „Poptat …“ u služeb předvybere typ práce */
  document.querySelectorAll('[data-preselect]').forEach(function (link) {
    link.addEventListener('click', function () {
      var val = link.getAttribute('data-preselect');
      var radio = form.querySelector('input[name="typ"][value="' + val + '"]');
      if (radio) { radio.checked = true; syncSlip(); }
      setTimeout(function () { form.jmeno.focus({ preventScroll: true }); }, reduce ? 0 : 450);
    });
  });

  /* Validace */
  var rules = {
    jmeno: function (v) { return v.trim().length > 0; },
    telefon: function (v) { return v.replace(/\D/g, '').length >= 9; },
    email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
  };
  function check(name) {
    var input = form[name];
    var ok = rules[name](input.value);
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    document.getElementById('e-' + (name === 'telefon' ? 'tel' : name)).hidden = ok;
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
    Object.keys(rules).forEach(function (name) {
      if (!check(name) && !firstBad) firstBad = form[name];
    });
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

  /* Na mobilu schovat pevné „Zavolat“, když je vidět formulář nebo kontakt */
  var bar = document.getElementById('call-bar');
  if (bar && 'IntersectionObserver' in window) {
    var visible = new Set();
    var barIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? visible.add(e.target) : visible.delete(e.target); });
      bar.classList.toggle('is-off', visible.size > 0);
    }, { threshold: 0.15 });
    ['hero-call', 'poptavka-form', 'kontakt'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) barIo.observe(el);
    });
  }
})();
