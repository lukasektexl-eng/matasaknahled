(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  // Jemné zobrazení prvků při rolování
  var items = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // Demo formulář – nic se neodesílá
  var form = document.getElementById('poptavka-form');
  var status = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var required = form.querySelectorAll('[required]');
    var firstBad = null;
    required.forEach(function (input) {
      var bad = !input.value.trim();
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && !firstBad) firstBad = input;
    });
    if (firstBad) {
      status.className = 'form-status err';
      status.textContent = 'Vyplňte prosím jméno a telefon.';
      firstBad.focus();
      return;
    }
    status.className = 'form-status ok';
    status.textContent = 'Ukázka: nic se neodesílá.';
  });
})();
