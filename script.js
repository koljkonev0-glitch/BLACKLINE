/* ============ BLACKLINE — script.js ============ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 1. ФОТОГРАФИИ ----------
     Локальная серия изображений, созданная ИИ для демонстрационного проекта.
     Портреты изображают вымышленных персонажей. */
  var PHOTOS_READY = true;
  var PHOTOS = {
    hero: 'images/hero.webp', interior: 'images/interior.webp', servicePhoto: 'images/process.webp',
    barber1: 'images/barber1.webp', barber2: 'images/barber2.webp', barber3: 'images/barber3.webp',
    gallery1: 'images/interior.webp', gallery2: 'images/tools.webp', gallery3: 'images/process.webp',
    gallery4: 'images/barber1.webp', gallery5: 'images/details.webp', gallery6: 'images/hairstyle.webp'
  };

  var PHOTO_DIMENSIONS = {"tools": [1536, 1024], "details": [1536, 1024], "process": [1122, 1402], "barber2": [1122, 1402], "barber3": [1122, 1402], "interior": [1122, 1402], "barber1": [1122, 1402], "hairstyle": [1536, 1024], "hero": [1024, 1536]};
  function applyPhoto(el, key) {
    if (!PHOTOS_READY || !PHOTOS[key]) return;
    var img = el.querySelector('img') || new Image();
    var src = PHOTOS[key];
    var stem = src.split('/').pop().replace('.webp', '');
    var dims = PHOTO_DIMENSIONS[stem];
    if (img.getAttribute('src') !== src) el.classList.remove('has-image');
    img.alt = '';
    img.decoding = 'async';
    var isLightbox = el.id === 'lb-photo';
    img.loading = key === 'hero' || isLightbox ? 'eager' : 'lazy';
    if (key === 'hero') img.fetchPriority = 'high';
    if (dims) {
      img.width = dims[0]; img.height = dims[1];
      img.sizes = isLightbox ? '(min-width: 1000px) 1000px, 95vw' :
        key === 'hero' ? '(max-width: 700px) 100vw, 70vw' :
        key.indexOf('barber') === 0 ? '(max-width: 700px) 100vw, 32vw' :
        '(max-width: 700px) 100vw, 60vw';
      img.srcset = 'images/' + stem + '-480.webp 480w, ' + src + ' ' + dims[0] + 'w';
    }
    img.onload = function () { el.classList.add('has-image'); };
    var usedFallback = false;
    img.onerror = function () {
      if (!usedFallback) {
        usedFallback = true;
        img.removeAttribute('srcset');
        img.src = src.replace('.webp', '.jpg');
        return;
      }
      el.classList.remove('has-image'); img.remove();
    };
    img.src = src;
    if (!img.parentNode) el.appendChild(img);
    if (img.complete && img.naturalWidth) el.classList.add('has-image');
  }
  document.querySelectorAll('.photo[data-photo]').forEach(function (el) {
    applyPhoto(el, el.getAttribute('data-photo'));
  });

  /* ---------- 2. Шапка и мобильное меню ---------- */
  var root = document.documentElement;
  var header = $('header'), nav = $('nav'), burger = $('burger'), toTop = $('to-top');

  function lockScroll(on) { root.classList.toggle('no-scroll', on); }
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    lockScroll(open || !!($('lightbox') && $('lightbox').open));
    document.querySelector('main').inert = open;
    document.querySelector('footer').inert = open;
    if (open) nav.querySelector('a').focus();
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (!nav.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setMenu(false); burger.focus(); }
    if (e.key === 'Tab') {
      var focusable = Array.prototype.slice.call(header.querySelectorAll('a[href],button'));
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });

  /* ---------- 3. Прокрутка: шапка, «наверх», подсветка раздела ---------- */
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 30);
    var show = y > 700;
    toTop.hidden = false;
    toTop.classList.toggle('is-visible', show);
    toTop.tabIndex = show ? 0 : -1;
    toTop.setAttribute('aria-hidden', String(!show));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('is-current'); links[k].removeAttribute('aria-current'); });
          links[en.target.id].classList.add('is-current');
          links[en.target.id].setAttribute('aria-current', 'location');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var s = $(id);
      if (s) spy.observe(s);
    });
  }

  /* ---------- 4. Появление блоков при прокрутке ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 5. Галерея и лайтбокс ---------- */
  var lightbox = $('lightbox'), lbPhoto = $('lb-photo'), lbCaption = $('lb-caption');
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__btn'));
  var current = 0, lastFocus = null;

  function showItem(i) {
    current = (i + items.length) % items.length;
    var b = items[current];
    var caption = b.getAttribute('data-caption');
    lbPhoto.setAttribute('data-photo', b.getAttribute('data-photo-key'));
    lbPhoto.setAttribute('aria-label', caption);
    applyPhoto(lbPhoto, b.getAttribute('data-photo-key'));
    lbCaption.textContent = caption + ' (' + (current + 1) + ' / ' + items.length + ')';
  }
  function openLightbox(i) {
    lastFocus = document.activeElement;
    showItem(i);
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
    lockScroll(true);
  }
  function closeLightbox() {
    if (typeof lightbox.close === 'function') lightbox.close();
    else { lightbox.removeAttribute('open'); lockScroll(false); }
  }
  items.forEach(function (b, i) { b.addEventListener('click', function () { openLightbox(i); }); });
  $('lb-close').addEventListener('click', closeLightbox);
  $('lb-prev').addEventListener('click', function () { showItem(current - 1); });
  $('lb-next').addEventListener('click', function () { showItem(current + 1); });
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('close', function () {
    lockScroll(false);
    if (lastFocus) lastFocus.focus();
  });
  lightbox.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') showItem(current - 1);
    if (e.key === 'ArrowRight') showItem(current + 1);
  });
  /* Escape закрывает окно встроенными средствами <dialog> */

  /* ---------- 6. Форма записи (ТОЛЬКО ДЕМО: ничего не отправляется и не сохраняется) ---------- */
  var form = $('booking-form');
  var fName = $('f-name'), fPhone = $('f-phone'), fService = $('f-service'),
      fMaster = $('f-master'), fDate = $('f-date'), fTime = $('f-time');
  var chosen = $('chosen'), successBox = $('success'), successList = $('success-list');

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /* Дата: нельзя выбрать прошедшие дни, максимум — на полгода вперёд */
  var today = new Date();
  var maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 180);
  fDate.min = fmtDate(today);
  fDate.max = fmtDate(maxDate);

  /* Время: слоты каждые 30 минут с 10:00 до 19:30 (салон работает до 21:00) */
  var SLOTS = [];
  for (var h = 10; h <= 19; h++) { SLOTS.push(pad(h) + ':00'); SLOTS.push(pad(h) + ':30'); }

  function buildTimes() {
    var keep = fTime.value;
    var isToday = fDate.value === fmtDate(new Date());
    var now = new Date();
    var limit = now.getHours() * 60 + now.getMinutes() + 15;
    fTime.innerHTML = '';
    var first = document.createElement('option');
    first.value = ''; first.textContent = 'Выберите время';
    fTime.appendChild(first);
    var available = 0;
    SLOTS.forEach(function (s) {
      var parts = s.split(':');
      var past = isToday && (parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) <= limit);
      var o = document.createElement('option');
      o.value = s; o.textContent = s; o.disabled = past;
      if (!past) available++;
      fTime.appendChild(o);
    });
    if (keep && !fTime.querySelector('option[value="' + keep + '"]:not(:disabled)')) keep = '';
    fTime.value = keep;
    return available;
  }
  buildTimes();

  /* Проверки */
  function digitsOf(v) { return v.replace(/\D/g, ''); }
  var validators = {
    name: function () {
      var v = fName.value.trim();
      if (!v) return 'Введите имя.';
      if (!/^[\p{L}][\p{L}\s'’\-]{1,39}$/u.test(v)) return 'Имя — от 2 букв, без цифр и лишних символов.';
      return '';
    },
    phone: function () {
      var v = fPhone.value.trim();
      if (!v) return 'Введите номер телефона.';
      if (!/^\+?[\d\s()\-]+$/.test(v)) return 'В номере допустимы только цифры, пробелы, скобки, дефис и «+».';
      var d = digitsOf(v);
      if (d.length === 11 && (d[0] === '7' || d[0] === '8')) return '';
      if (d.length === 10 && d[0] !== '0' && d[0] !== '1') return '';
      return 'Проверьте номер: например, +7 (900) 000-00-00.';
    },
    service: function () { return fService.value ? '' : 'Выберите услугу.'; },
    master: function () { return fMaster.value ? '' : 'Выберите мастера или «Любой мастер».'; },
    date: function () {
      var v = fDate.value;
      if (!v) return 'Выберите дату.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Некорректная дата.';
      if (v < fmtDate(new Date())) return 'Прошедшие даты выбрать нельзя.';
      if (v > fDate.max) return 'Запись открыта на 180 дней вперёд.';
      return '';
    },
    time: function () {
      if (!fTime.value) {
        var isToday = fDate.value === fmtDate(new Date());
        if (isToday && !fTime.querySelector('option[value]:not([value=""]):not(:disabled)')) {
          return 'На сегодня свободного времени не осталось — выберите другую дату.';
        }
        return 'Выберите время.';
      }
      return '';
    }
  };
  var inputs = { name: fName, phone: fPhone, service: fService, master: fMaster, date: fDate, time: fTime };

  function setError(key, msg) {
    var field = form.querySelector('[data-field="' + key + '"]');
    var box = $('e-' + key);
    field.classList.toggle('has-error', !!msg);
    box.textContent = msg;
    if (msg) inputs[key].setAttribute('aria-invalid', 'true'); else inputs[key].removeAttribute('aria-invalid');
  }
  function validateField(key) { var m = validators[key](); setError(key, m); return !m; }

  Object.keys(inputs).forEach(function (key) {
    inputs[key].addEventListener('blur', function () {
      if (inputs[key].value || inputs[key].closest('.field').classList.contains('has-error')) validateField(key);
    });
    inputs[key].addEventListener('input', function () {
      if (inputs[key].closest('.field').classList.contains('has-error')) validateField(key);
    });
    inputs[key].addEventListener('change', function () {
      if (key === 'date') { buildTimes(); if (fDate.value) validateField('date'); }
      if (key === 'service' || key === 'master') updateChosen();
      if (inputs[key].closest('.field').classList.contains('has-error')) validateField(key);
    });
  });

  function updateChosen() {
    var parts = [];
    if (fService.value) parts.push('Услуга: ' + fService.value);
    if (fMaster.value) parts.push('Мастер: ' + fMaster.value);
    chosen.textContent = parts.join(' · ');
  }

  /* Кнопки «Записаться» у услуг и мастеров подставляют выбор в форму */
  function goToForm(focusEl) {
    var target = $('booking');
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () { try { focusEl.focus({ preventScroll: true }); } catch (e) { focusEl.focus(); } }, reduceMotion ? 0 : 650);
  }
  function showFormAgain() {
    successBox.hidden = true;
    form.hidden = false;
  }
  function firstEmptyField() {
    var order = ['name', 'phone', 'service', 'master', 'date', 'time'];
    for (var i = 0; i < order.length; i++) { if (!inputs[order[i]].value) return inputs[order[i]]; }
    return fName;
  }
  document.querySelectorAll('[data-service]').forEach(function (b) {
    b.addEventListener('click', function () {
      showFormAgain();
      fService.value = b.getAttribute('data-service');
      setError('service', '');
      updateChosen();
      goToForm(firstEmptyField());
    });
  });
  document.querySelectorAll('[data-master]').forEach(function (b) {
    b.addEventListener('click', function () {
      showFormAgain();
      fMaster.value = b.getAttribute('data-master');
      setError('master', '');
      updateChosen();
      goToForm(firstEmptyField());
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();               // ничего никуда не отправляем
    buildTimes(); // Recheck slots if the page has been open for a while.
    var firstBad = null;
    Object.keys(inputs).forEach(function (key) {
      if (!validateField(key) && !firstBad) firstBad = inputs[key];
    });
    if (firstBad) { firstBad.focus(); return; }

    /* Итог показываем только на странице, через textContent; в памяти браузера ничего не сохраняется */
    var rows = [
      ['Имя', fName.value.trim()],
      ['Услуга', fService.value],
      ['Мастер', fMaster.value],
      ['Дата', fDate.value.split('-').reverse().join('.')],
      ['Время', fTime.value]
    ];
    successList.innerHTML = '';
    rows.forEach(function (r) {
      var wrap = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      wrap.appendChild(dt); wrap.appendChild(dd); successList.appendChild(wrap);
    });
    form.hidden = true;
    successBox.hidden = false;
    var title = $('success-title');
    title.focus();
    successBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  $('new-booking').addEventListener('click', function () {
    form.reset();
    Object.keys(inputs).forEach(function (k) { setError(k, ''); });
    buildTimes();
    updateChosen();
    showFormAgain();
    fName.focus();
  });
  successBox.setAttribute('role', 'status');
})();
