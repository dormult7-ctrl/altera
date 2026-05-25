/* =========================================================
   ALTERA-CLIMAT — interaction layer
   ========================================================= */

/* ---------- helpers ---------- */
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(n));

/* ---------- mobile nav ---------- */
const burger = $('#burger');
const nav = $('.nav');
burger?.addEventListener('click', () => nav.classList.toggle('open'));
$$('.nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

/* ---------- phone mask ---------- */
function maskPhone(input) {
  input.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (!v.startsWith('7')) v = '7' + v;
    v = v.slice(0, 11);
    let f = '+7';
    if (v.length > 1) f += ' (' + v.slice(1, 4);
    if (v.length >= 5) f += ') ' + v.slice(4, 7);
    if (v.length >= 8) f += '-' + v.slice(7, 9);
    if (v.length >= 10) f += '-' + v.slice(9, 11);
    e.target.value = f;
  });
}
$$('input[type=tel]').forEach(maskPhone);

/* ---------- header shadow on scroll ---------- */
const header = $('#header');
window.addEventListener('scroll', () => {
  header.style.boxShadow = window.scrollY > 8 ? 'var(--shadow-sm)' : 'none';
});

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => e.isIntersecting && e.target.classList.add('in'));
}, { threshold: .12 });
$$('.section, .service, .tier, .card, .review, .floating, .timeline__step').forEach(el => {
  el.classList.add('reveal');
  io.observe(el);
});

/* ---------- hero device animated temp ---------- */
const tempEl = $('#tempNum');
let temps = ['+22', '+23', '+24', '+22', '+21', '+22'];
let ti = 0;
setInterval(() => {
  ti = (ti + 1) % temps.length;
  if (tempEl) tempEl.textContent = temps[ti];
}, 2200);

/* =========================================================
   QUIZ
   ========================================================= */
const quizState = {
  step: 1,
  total: 6,
  data: { place: '', area: 25, features: [], budget: '', when: '', contact: 'Звонок', name: '', phone: '' }
};

const quizSteps = $$('.quiz__step', $('#quizBox'));
const quizBar = $('#quizBar');
const quizStepLabel = $('#quizStepLabel');
const quizPrev = $('#quizPrev');
const quizNext = $('#quizNext');

function renderStep() {
  quizSteps.forEach(s => s.classList.remove('active'));
  const cur = $$('.quiz__step', $('#quizBox')).find(s => s.dataset.step == quizState.step);
  cur?.classList.add('active');

  if (quizState.step === 'done') {
    quizBar.style.width = '100%';
    quizStepLabel.textContent = 'Готово';
    quizPrev.style.visibility = 'hidden';
    quizNext.style.visibility = 'hidden';
    return;
  }
  const pct = (quizState.step / quizState.total) * 100;
  quizBar.style.width = pct + '%';
  quizStepLabel.textContent = `Шаг ${quizState.step} из ${quizState.total}`;
  quizPrev.style.visibility = quizState.step > 1 ? 'visible' : 'hidden';
  quizNext.style.visibility = 'visible';
  quizNext.textContent = quizState.step === quizState.total ? 'Получить подборку →' : 'Далее →';
}

/* options click */
$$('#quizBox .opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.key;
    if (!key) return;
    if (btn.dataset.multi) {
      btn.classList.toggle('active');
      const arr = $$(`#quizBox .opt[data-key="${key}"].active`).map(b => b.dataset.val);
      quizState.data[key] = arr;
    } else {
      $$(`#quizBox .opt[data-key="${key}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      quizState.data[key] = btn.dataset.val;
      // auto-advance for single-choice steps (1,4,5)
      if ([1, 4, 5].includes(quizState.step)) {
        setTimeout(() => {
          quizState.step++;
          renderStep();
        }, 220);
      }
    }
  });
});

/* area slider */
const areaRange = $('#areaRange');
const areaVal = $('#areaVal');
const areaHint = $('#areaHint');
function updateArea(v) {
  quizState.data.area = +v;
  areaVal.textContent = v;
  const power = Math.max(1.5, Math.round((v / 10 + 0.5) * 10) / 10);
  const cls = power <= 2.1 ? '07' : power <= 2.7 ? '09' : power <= 3.6 ? '12' : power <= 5.4 ? '18' : '24';
  areaHint.innerHTML = `Рекомендуемая мощность: <b>${power.toFixed(1)} кВт</b> · класс «${cls}»`;
}
areaRange?.addEventListener('input', e => updateArea(e.target.value));
updateArea(25);

/* nav buttons */
quizPrev.addEventListener('click', () => {
  if (quizState.step === 'done') quizState.step = quizState.total;
  else if (quizState.step > 1) quizState.step--;
  renderStep();
});
quizNext.addEventListener('click', () => {
  if (quizState.step === quizState.total) {
    submitQuiz();
    return;
  }
  if (quizState.step < quizState.total) {
    quizState.step++;
    renderStep();
  }
});

/* contact-method buttons inside step 6 */
$$('#quizBox .opt[data-key=contact]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('#quizBox .opt[data-key=contact]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    quizState.data.contact = btn.dataset.val;
  });
});

function submitQuiz() {
  const form = $('#quizForm');
  const fd = new FormData(form);
  quizState.data.name = (fd.get('name') || '').toString().trim();
  quizState.data.phone = (fd.get('phone') || '').toString().trim();
  if (!quizState.data.name || quizState.data.phone.replace(/\D/g, '').length < 11) {
    form.reportValidity?.();
    return;
  }
  const d = quizState.data;
  $('#quizSummary').innerHTML = `
    <div><b>Помещение:</b> ${d.place || '—'}</div>
    <div><b>Площадь:</b> ${d.area} м²</div>
    <div><b>Функции:</b> ${(Array.isArray(d.features) && d.features.length) ? d.features.join(', ') : '—'}</div>
    <div><b>Бюджет:</b> ${d.budget || '—'}</div>
    <div><b>Срок установки:</b> ${d.when || '—'}</div>
    <div><b>Связь:</b> ${d.contact} · ${d.phone}</div>
  `;
  quizState.step = 'done';
  renderStep();
  showToast();
}

renderStep();

/* =========================================================
   CALCULATOR
   ========================================================= */
const calc = {
  area: 25,
  h: 2.7,
  sun: 1,
  mount: 'tu',
  tier: 'basic'
};

const eqPrices = {
  basic:   { '07': [25000, 35000], '09': [27000, 38000], '12': [33000, 48000], '18': [55000, 75000], '24': [70000, 95000] },
  mid:     { '07': [40000, 60000], '09': [45000, 65000], '12': [55000, 80000], '18': [80000, 120000], '24': [100000, 150000] },
  premium: { '07': [80000, 120000], '09': [90000, 140000], '12': [120000, 180000], '18': [180000, 250000], '24': [220000, 320000] }
};
const mountPrices = {
  economy: { '07': [4000, 7000], '09': [4000, 7000], '12': [5000, 8000], '18': [7000, 11000], '24': [9000, 13000] },
  tu:      { '07': [8000, 14000], '09': [8000, 14000], '12': [10000, 16000], '18': [13000, 19000], '24': [16000, 24000] },
  gost:    { '07': [16000, 26000], '09': [16000, 26000], '12': [18000, 30000], '18': [25000, 38000], '24': [32000, 48000] }
};

function powerFromArea(area, h, sun) {
  // упрощённая формула: 1 кВт на 10 м² при h=2.7, поправка на потолок и солнечность
  const base = (area * h / 27) * sun;
  const power = Math.max(2.0, Math.round(base * 10) / 10);
  return power;
}
function classFromPower(p) {
  if (p <= 2.3) return '07';
  if (p <= 2.9) return '09';
  if (p <= 3.8) return '12';
  if (p <= 5.5) return '18';
  return '24';
}

function recalc() {
  const power = powerFromArea(calc.area, calc.h, calc.sun);
  const cls = classFromPower(power);
  $('#rPower').textContent = power.toFixed(1);
  $('#rClass').textContent = cls;
  const eq = eqPrices[calc.tier][cls];
  const mnt = mountPrices[calc.mount][cls];
  $('#rEqMin').textContent = fmt(eq[0]);
  $('#rEqMax').textContent = fmt(eq[1]);
  $('#rMntMin').textContent = fmt(mnt[0]);
  $('#rMntMax').textContent = fmt(mnt[1]);
  $('#rTotal').textContent = `${fmt(eq[0] + mnt[0])} – ${fmt(eq[1] + mnt[1])} ₽`;
}

$('#cAreaRange')?.addEventListener('input', e => { calc.area = +e.target.value; $('#cArea').textContent = e.target.value; recalc(); });
$('#cHRange')?.addEventListener('input', e => { calc.h = +e.target.value; $('#cH').textContent = parseFloat(e.target.value).toFixed(1); recalc(); });

$$('.calc .pill').forEach(p => {
  p.addEventListener('click', () => {
    const c = p.dataset.c;
    $$(`.calc .pill[data-c="${c}"]`).forEach(b => b.classList.remove('active'));
    p.classList.add('active');
    calc[c] = isNaN(+p.dataset.v) ? p.dataset.v : +p.dataset.v;
    recalc();
  });
});
recalc();

/* =========================================================
   CATALOG FILTER
   ========================================================= */
$$('.cat-filters .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    $$('.cat-filters .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const f = chip.dataset.filter;
    $$('.catalog .card').forEach(card => {
      const tags = (card.dataset.tags || '').split(/\s+/);
      const show = f === 'all' || tags.includes(f);
      card.style.display = show ? '' : 'none';
    });
  });
});

/* =========================================================
   LEAD FORM
   ========================================================= */
$('#leadForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const name = (fd.get('name') || '').toString().trim();
  const phone = (fd.get('phone') || '').toString().trim();
  if (!name || phone.replace(/\D/g, '').length < 11) {
    e.target.reportValidity();
    return;
  }
  e.target.reset();
  showToast();
});

/* =========================================================
   TOAST
   ========================================================= */
let toastTimer;
function showToast() {
  const t = $('#toast');
  if (!t) return;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4500);
}


/* =========================================================
   PREMIUM EFFECTS
   ========================================================= */

/* ---------- SCROLL PROGRESS ---------- */
const sp = $('#scrollProgress');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  if (sp) sp.style.width = pct + '%';
}, { passive: true });

/* ---------- MAGNETIC PRIMARY BUTTONS ---------- */
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  $$('.btn--primary').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const mx = e.clientX - r.left - r.width / 2;
      const my = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${mx * .2}px, ${my * .2}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
  });
}

/* ---------- HERO PARALLAX ---------- */
(function parallax() {
  const stage = $('#heroVisual');
  if (!stage) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const els = $$('[data-depth]', stage);
  stage.addEventListener('mousemove', e => {
    const r = stage.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width - .5;
    const my = (e.clientY - r.top) / r.height - .5;
    els.forEach(el => {
      const d = parseFloat(el.dataset.depth) || 1;
      el.style.transform = `translate3d(${mx * 18 * d}px, ${my * 18 * d}px, 0) rotateX(${-my * 6}deg) rotateY(${mx * 6}deg)`;
    });
  });
  stage.addEventListener('mouseleave', () => {
    els.forEach(el => el.style.transform = '');
  });
})();

/* ---------- ANIMATED COUNTERS ---------- */
(function counters() {
  const els = $$('[data-count]');
  if (!els.length) return;
  const seen = new WeakSet();
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting || seen.has(e.target)) return;
      seen.add(e.target);
      const target = parseFloat(e.target.dataset.count);
      const suf = e.target.dataset.suffix || '';
      const isFloat = !Number.isInteger(target);
      const dur = 1400, t0 = performance.now();
      function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = target * eased;
        e.target.textContent = (isFloat ? v.toFixed(1) : Math.round(v).toLocaleString('ru-RU')) + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: .4 });
  els.forEach(el => obs.observe(el));
})();
