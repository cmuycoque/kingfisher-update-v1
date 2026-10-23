(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var header = $('#header'), top = $('.totop'), nav = $('.nav'), burger = $('.burger');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 10);
    top.classList.toggle('show', window.scrollY > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });

  var page = location.pathname.split('/').pop() || 'index.html';
  if (page.indexOf('article-') === 0) page = 'insights.html';
  $$('.nav a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  var tabs = $$('.tab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t); });
      $$('.panel').forEach(function (p) { p.classList.toggle('on', p.id === t.dataset.target); });
    });
  });

  $$('[data-count]').forEach(function (el) {
    var end = +el.dataset.count, suffix = el.dataset.suffix || '', done = false;
    function run() {
      if (done) return; done = true;
      var start = null;
      (function step(ts) {
        start = start || ts;
        var p = Math.min((ts - start) / 1200, 1);
        el.textContent = Math.round(end * p) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { run(); o.disconnect(); } }).observe(el);
    } else { run(); }
  });

  var fb = $$('.filters button');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      fb.forEach(function (x) { x.classList.toggle('on', x === b); });
      $$('[data-cat]').forEach(function (c) {
        c.parentElement.hidden = !(b.dataset.f === 'all' || c.dataset.cat === b.dataset.f);
      });
    });
  });

  var form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = 'Name: ' + d.get('name') + '\nCompany: ' + d.get('company') + '\nEmail: ' + d.get('email') + '\n\n' + d.get('message');
      location.href = 'mailto:kingfisherandkite@gmail.com?subject=' + encodeURIComponent('Inquiry: ' + d.get('service')) + '&body=' + encodeURIComponent(body);
      $('.note', form).textContent = 'Thanks! Your email app should open with your message ready to send.';
    });
  }
})();
