/* ═══════════════════════════════════════════════
   MindMetric — Application Logic
   ═══════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   1. THEME MANAGEMENT
───────────────────────────────────────────── */
const ThemeManager = (() => {
  const html     = document.documentElement;
  const btn      = document.getElementById('themeToggle');
  const sunIcon  = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');

  function apply(dark) {
    if (dark) {
      html.classList.add('dark');
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      html.classList.remove('dark');
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
    localStorage.setItem('mm_theme', dark ? 'dark' : 'light');
  }

  function init() {
    const stored      = localStorage.getItem('mm_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(stored === 'dark' || (!stored && prefersDark));

    btn.addEventListener('click', () => {
      apply(!html.classList.contains('dark'));
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('mm_theme')) apply(e.matches);
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────
   2. PARTICLE BACKGROUND
───────────────────────────────────────────── */
const ParticleEngine = (() => {
  const canvas = document.getElementById('particleCanvas');
  const ctx    = canvas.getContext('2d');
  let particles = [];
  let W, H;

  canvas.style.pointerEvents = 'none';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.zIndex = '0';

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkParticle() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.4 + 0.3,
      vx:    (Math.random() - 0.5) * 0.22,
      vy:    (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.35 + 0.04,
      hue:   [160, 250, 40][Math.floor(Math.random() * 3)],
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const isDark = document.documentElement.classList.contains('dark');

    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},65%,${isDark ? 72 : 48}%,${p.alpha})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    }
    requestAnimationFrame(draw);
  }

  function init() {
    resize();
    window.addEventListener('resize', resize, { passive: true });
    particles = Array.from({ length: 55 }, mkParticle);
    draw();
  }

  return { init };
})();

/* ─────────────────────────────────────────────
   3. STICKY HEADER
───────────────────────────────────────────── */
function initStickyHeader() {
  const header = document.getElementById('mainHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   4. RANGE INPUTS
───────────────────────────────────────────── */
function initRangeInputs() {
  const avgRange = document.getElementById('avgHours');
  const avgVal   = document.getElementById('avgHoursVal');
  const avgGlow  = document.getElementById('avgHoursGlow');

  function updateAvg() {
    const v = parseFloat(avgRange.value);
    avgVal.textContent = v;
    avgGlow.style.width = (v / avgRange.max * 100) + '%';
    if (v > 8)
      avgGlow.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)';
    else if (v > 4)
      avgGlow.style.background = 'linear-gradient(90deg,#f59e0b,#ef4444)';
    else
      avgGlow.style.background = 'linear-gradient(90deg,#10b981,#059669)';
  }
  avgRange.addEventListener('input', updateAvg);
  updateAvg();

  const sleepRange = document.getElementById('sleep');
  const sleepVal   = document.getElementById('sleepVal');
  const sleepGlow  = document.getElementById('sleepGlow');

  function updateSleep() {
    const v = parseFloat(sleepRange.value);
    sleepVal.textContent = v;
    sleepGlow.style.width = (v / sleepRange.max * 100) + '%';
  }
  sleepRange.addEventListener('input', updateSleep);
  updateSleep();
}

/* ─────────────────────────────────────────────
   5. STRESS CHIPS
───────────────────────────────────────────── */
function initStressChips() {
  const chips  = document.querySelectorAll('.stress-chip');
  const hidden = document.getElementById('stress');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      hidden.value = chip.dataset.value;
      chip.animate(
        [{ transform: 'scale(0.92)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
        { duration: 260, easing: 'ease' }
      );
      clearFieldError(hidden.closest('.field-card'));
      updateProgress();
    });
  });
}

/* ─────────────────────────────────────────────
   6. PROGRESS TRACKER
───────────────────────────────────────────── */
const TOTAL_FIELDS = 12;

function countFilled() {
  return [
    document.getElementById('age').value.trim(),
    document.getElementById('gender').value,
    document.getElementById('country').value,
    document.getElementById('academic').value,
    document.getElementById('stress').value,
    document.getElementById('platform').value,
    document.getElementById('purpose').value,
    document.getElementById('avgHours').value,
    document.getElementById('unlocks').value.trim(),
    document.getElementById('study').value.trim(),
    document.getElementById('activity').value.trim(),
    document.getElementById('sleep').value,
  ].filter(v => v !== '').length;
}

function updateProgress() {
  const pct = Math.round((countFilled() / TOTAL_FIELDS) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressPct').textContent  = pct + '%';
}

function initProgress() {
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input',  updateProgress);
    el.addEventListener('change', updateProgress);
  });
}

/* ─────────────────────────────────────────────
   7. FIELD CARD STATES
───────────────────────────────────────────── */
function initFieldStates() {
  document.querySelectorAll('.field-input, .field-select').forEach(el => {
    ['change', 'blur'].forEach(evt =>
      el.addEventListener(evt, () => markFilled(el))
    );
  });
}

function markFilled(el) {
  const card = el.closest('.field-card');
  if (!card) return;
  if (el.value.trim()) {
    card.classList.add('field-filled');
    card.classList.remove('field-error');
  } else {
    card.classList.remove('field-filled');
  }
}

/* ─────────────────────────────────────────────
   8. VALIDATION
───────────────────────────────────────────── */
function showFieldError(card, msg) {
  if (!card) return;
  card.classList.add('field-error');
  card.classList.remove('field-filled');
  const err = card.querySelector('.field-err');
  if (err) { err.textContent = msg; err.classList.remove('hidden'); }
  card.animate(
    [{ transform:'translateX(0)' },{ transform:'translateX(-6px)' },
     { transform:'translateX(6px)' },{ transform:'translateX(-3px)' },
     { transform:'translateX(0)' }],
    { duration: 280, easing: 'ease' }
  );
}

function clearFieldError(card) {
  if (!card) return;
  card.classList.remove('field-error');
  const err = card.querySelector('.field-err');
  if (err) { err.textContent = ''; err.classList.add('hidden'); }
}

function validateForm() {
  let valid    = true;
  let firstErr = null;

  const numFields = [
    { id: 'age',      label: 'Age',            min: 5,  max: 100 },
    { id: 'unlocks',  label: 'Daily Unlocks',  min: 0,  max: 500 },
    { id: 'study',    label: 'Study Hours',    min: 0,  max: 20  },
    { id: 'activity', label: 'Activity Hours', min: 0,  max: 16  },
  ];

  numFields.forEach(f => {
    const el   = document.getElementById(f.id);
    const card = el.closest('.field-card');
    const val  = el.value.trim();
    clearFieldError(card);

    if (!val) {
      showFieldError(card, `${f.label} is required.`);
      valid = false; if (!firstErr) firstErr = card; return;
    }
    const num = Number(val);
    if (isNaN(num)) {
      showFieldError(card, 'Enter a valid number.');
      valid = false; if (!firstErr) firstErr = card; return;
    }
    if (f.min !== undefined && num < f.min) {
      showFieldError(card, `Minimum is ${f.min}.`);
      valid = false; if (!firstErr) firstErr = card; return;
    }
    if (f.max !== undefined && num > f.max) {
      showFieldError(card, `Maximum is ${f.max}.`);
      valid = false; if (!firstErr) firstErr = card; return;
    }
    card.classList.add('field-filled');
  });

  if (valid) {
    const screen   = parseFloat(document.getElementById('avgHours').value)  || 0;
    const study    = parseFloat(document.getElementById('study').value)      || 0;
    const activity = parseFloat(document.getElementById('activity').value)   || 0;
    const sleep    = parseFloat(document.getElementById('sleep').value)      || 0;
    const total    = screen + study + activity + sleep;

    if (total > 24) {
      ['avgHours','study','activity','sleep'].forEach(id => {
        const el = document.getElementById(id);
        showFieldError(
          el.closest('.field-card'),
          `Hours total ${total.toFixed(1)}h — must be ≤ 24h combined.`
        );
        if (!firstErr) firstErr = el.closest('.field-card');
      });
      valid = false;
    }
  }

  ['gender','country','academic','platform','purpose'].forEach(id => {
    const el   = document.getElementById(id);
    const card = el.closest('.field-card');
    clearFieldError(card);
    if (!el.value) {
      const label = el.closest('.field-card').querySelector('.field-label').textContent;
      showFieldError(card, `${label.trim()} is required.`);
      valid = false; if (!firstErr) firstErr = card;
    }
  });

  const stressCard = document.getElementById('stress').closest('.field-card');
  clearFieldError(stressCard);
  if (!document.getElementById('stress').value) {
    showFieldError(stressCard, 'Please select a stress level.');
    valid = false; if (!firstErr) firstErr = stressCard;
  }

  if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return valid;
}

/* ─────────────────────────────────────────────
   9. ERROR BANNER
───────────────────────────────────────────── */
function showErrorBanner(msg) {
  const banner = document.getElementById('errorBanner');
  document.getElementById('errorMsg').textContent = msg;
  banner.classList.remove('hidden');
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function hideErrorBanner() {
  document.getElementById('errorBanner').classList.add('hidden');
}
function initErrorBanner() {
  document.getElementById('closeError').addEventListener('click', hideErrorBanner);
}

/* ─────────────────────────────────────────────
   10. LOADING STATE
───────────────────────────────────────────── */
function setLoading(loading) {
  const btn      = document.getElementById('submitBtn');
  const txtWrap  = document.getElementById('btnText');
  const spinner  = document.getElementById('btnSpinner');
  const slowHint = document.getElementById('slowHint');

  btn.disabled = loading;
  spinner.classList.toggle('hidden', !loading);

  if (loading) {
    txtWrap.innerHTML = `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813
          a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09
          L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
      </svg>
      Analyzing…`;
      
    window._slowTimer = setTimeout(() => {
      if (slowHint) slowHint.classList.remove('hidden');
    }, 5000);
    
  } else {
    txtWrap.innerHTML = `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813
          a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09
          L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
      </svg>
      Assess My Wellness`;
      
    clearTimeout(window._slowTimer);
    if (slowHint) slowHint.classList.add('hidden');
  }
}

/* ─────────────────────────────────────────────
   11. CONFETTI
───────────────────────────────────────────── */
function launchConfetti(score) {
  if (score < 5) return;
  const canvas = document.getElementById('confettiCanvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const count  = score >= 7.5 ? 110 : 55;
  const pieces = Array.from({ length: count }, () => ({
    x:     Math.random() * canvas.width,
    y:     -10 - Math.random() * 60,
    r:     Math.random() * 6 + 3,
    color: ['#10b981','#34d399','#6366f1','#f59e0b','#ef4444','#8b5cf6'][Math.floor(Math.random()*6)],
    vy:    Math.random() * 3 + 1.5,
    vx:    (Math.random() - 0.5) * 2.5,
    spin:  (Math.random() - 0.5) * 0.18,
    angle: 0,
    shape: Math.random() < 0.5 ? 'circle' : 'rect',
  }));

  let frame = 0;
  (function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const alpha = Math.max(0, 1 - frame / 110);
    pieces.forEach(p => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillRect(-p.r, -p.r/2, p.r*2, p.r);
      }
      ctx.restore();
      p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.angle += p.spin;
    });
    frame++;
    if (frame < 140) requestAnimationFrame(animate);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  })();
}

/* ─────────────────────────────────────────────
   12. SCORE THEME (UPDATED TO CLINICAL STYLE)
───────────────────────────────────────────── */
function getScoreTheme(score) {
  if (score >= 7.5) return {
    color: '#10b981', darkColor: '#34d399',
    gradStart: '#34d399', gradEnd: '#059669',
    label: 'Optimal Wellbeing',
    desc: 'Your indicators reflect strong mental wellbeing. Maintain your current routines to support sustained focus and emotional resilience.',
    badge: 'Optimal',
    recs: [
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>', text:"Maintain current mindfulness and cognitive pacing practices." },
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>', text:'Sustain physical activity routines to preserve metabolic and mental clarity.' },
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>', text:'Sleep architecture is stable; protect your current circadian schedule.' },
    ],
  };
  if (score >= 5) return {
    color: '#f59e0b', darkColor: '#fbbf24',
    gradStart: '#fbbf24', gradEnd: '#f59e0b',
    label: 'Moderate Wellbeing',
    desc: 'Your baseline is stable, but specific dimensions show friction. Targeted adjustments to sleep, screen time, or activity will yield measurable improvements.',
    badge: 'Moderate',
    recs: [
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>', text:'Implement a 30-minute reduction in daily screen time to monitor cognitive load.' },
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>', text:'Aim for 7–9 hours of uninterrupted sleep to optimize recovery.' },
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>', text:'Integrate short cognitive reset breaks during extended focus periods.' },
    ],
  };
  if (score >= 3) return {
    color: '#f97316', darkColor: '#fb923c',
    gradStart: '#fb923c', gradEnd: '#f97316',
    label: 'Below Average',
    desc: 'Lifestyle patterns indicate elevated stress or disruption. Reviewing daily habits and establishing firmer boundaries is recommended.',
    badge: 'Attention Needed',
    recs: [
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>', text:'Establish rigid screen-free intervals, particularly in the 60 minutes pre-sleep.' },
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>', text:'Consider scheduling time to discuss stress factors with a trusted mentor or counselor.' },
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>', text:'Utilize daily journaling to identify and process recurring stress triggers.' },
    ],
  };
  return {
    color: '#ef4444', darkColor: '#f87171',
    gradStart: '#f87171', gradEnd: '#dc2626',
    label: 'Critical Priority',
    desc: "Data suggests significant distress and lifestyle imbalance. Immediate intervention or consultation with a clinical professional is strongly advised.",
    badge: 'Critical',
    recs: [
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>', text:'Initiate contact with a mental health professional or general practitioner.' },
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>', text:'Significantly curtail non-essential digital media consumption immediately.' },
      { icon: '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>', text:'Treat 8 hours of restorative sleep as a non-negotiable daily medical requirement.' },
    ],
  };
}

/* ─────────────────────────────────────────────
   13. RENDER RESULT (UPDATED UI)
───────────────────────────────────────────── */
function renderResult(apiResponse) {
  const score   = typeof apiResponse === 'number' ? apiResponse : apiResponse.predicted_score;
  const clamped = Math.min(Math.max(score, 0), 10);
  const theme   = getScoreTheme(clamped);
  const isDark  = document.documentElement.classList.contains('dark');

  const apiNote       = apiResponse.note        || theme.desc;
  const apiDimensions = apiResponse.dimensions  || [];
  const assessedAt    = apiResponse.assessed_at || null;

  const card = document.getElementById('resultCard');
  card.classList.remove('hidden');

  const gs = document.querySelector('#ringGrad stop:first-child');
  const ge = document.querySelector('#ringGrad stop:last-child');
  if (gs) gs.setAttribute('stop-color', theme.gradStart);
  if (ge) ge.setAttribute('stop-color', theme.gradEnd);

  const circle = document.getElementById('scoreCircle');
  const circum = 326.7;
  setTimeout(() => {
    circle.style.strokeDashoffset = circum - (clamped / 10) * circum;
  }, 120);

  const scoreDisplay = document.getElementById('scoreDisplay');
  const t0  = performance.now();
  const dur = 1300;
  (function countUp(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    scoreDisplay.textContent = (e * clamped).toFixed(1);
    if (p < 1) requestAnimationFrame(countUp);
    else scoreDisplay.textContent = clamped.toFixed(1);
  })(t0);
  scoreDisplay.style.color = isDark ? theme.darkColor : theme.color;

  const badge = document.getElementById('resultBadge');
  badge.textContent        = theme.badge;
  badge.style.background   = `${theme.color}18`;
  badge.style.borderColor  = `${theme.color}35`;
  badge.style.color        = isDark ? theme.darkColor : theme.color;

  const headline = document.getElementById('scoreLabel');
  headline.textContent = theme.label;
  
  document.getElementById('scoreDesc').textContent = apiNote;

  // 1. Professional Data Grid (Replacing Pills)
  const pills = [
    { label:'Sleep',    val: document.getElementById('sleep').value + 'h' },
    { label:'Screen',   val: document.getElementById('avgHours').value + 'h' },
    { label:'Stress',   val: document.getElementById('stress').value },
    { label:'Activity', val: document.getElementById('activity').value + 'h' },
    { label:'Study',    val: document.getElementById('study').value + 'h' },
    { label:'Unlocks',  val: document.getElementById('unlocks').value },
  ];
  
  document.getElementById('metricPills').innerHTML = pills.map((m, i) =>
    `<div class="flex flex-col p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm" style="animation-delay:${i*0.04}s">
       <span class="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">${m.label}</span>
       <span class="text-sm font-bold text-slate-800 dark:text-slate-100">${m.val}</span>
     </div>`
  ).join('');

  // 2. Horizontal Dimension Bars (Replacing Floating Mini-bars)
  const dimContainer = document.getElementById('dimensionInsights');
  if (dimContainer && apiDimensions.length > 0) {
    dimContainer.innerHTML = apiDimensions.map((d, i) => {
      const pct   = (d.score / 10 * 100).toFixed(0);
      const color = d.score >= 7 ? 'bg-emerald-500' : d.score >= 5 ? 'bg-amber-500' : 'bg-rose-500';
      return `
        <div class="animate-fade-in" style="animation-delay:${i * 0.05}s">
          <div class="flex justify-between items-end mb-1.5">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${d.dimension}</span>
            <span class="text-xs font-bold text-slate-900 dark:text-white">${d.score}<span class="text-slate-400 font-normal">/10</span></span>
          </div>
          <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full ${color} rounded-full transition-all duration-1000 ease-out" style="width: 0%" data-target-width="${pct}%"></div>
          </div>
          <p class="text-[10px] text-slate-500 mt-1.5">${d.insight}</p>
        </div>`;
    }).join('');
    
    dimContainer.classList.remove('hidden');
    
    setTimeout(() => {
      dimContainer.querySelectorAll('.transition-all').forEach(bar => {
        bar.style.width = bar.getAttribute('data-target-width');
      });
    }, 100);
  } else if (dimContainer) {
    dimContainer.classList.add('hidden');
  }

  // 3. Assessed At timestamp
  const tsEl = document.getElementById('assessedAt');
  if (tsEl && assessedAt) {
    const dt = new Date(assessedAt);
    tsEl.textContent = 'Assessed ' + dt.toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short'
    });
    tsEl.classList.remove('hidden');
  }

  // 4. Actionable Recommendations
  document.getElementById('recItems').innerHTML = theme.recs.map((r, i) =>
    `<div class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50" style="animation-delay:${0.1+i*0.08}s">
       <div class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
         ${r.icon}
       </div>
       <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${r.text}</p>
     </div>`
  ).join('');

  document.getElementById('resultTopBar').style.background =
    `linear-gradient(90deg,${theme.gradStart},${theme.gradEnd},${theme.color})`;

  setTimeout(() => launchConfetti(clamped), 500);
  setTimeout(() => card.scrollIntoView({ behavior:'smooth', block:'start' }), 250);
}

/* ─────────────────────────────────────────────
   14. BUILD PAYLOAD
───────────────────────────────────────────── */
function buildPayload() {
  return {
    Age:                     parseInt(document.getElementById('age').value),
    Gender:                  document.getElementById('gender').value,
    Country:                 document.getElementById('country').value,
    Academic_Level:          document.getElementById('academic').value,
    Most_Used_Platform:      document.getElementById('platform').value,
    Purpose_Of_Use:          document.getElementById('purpose').value,
    Avg_Daily_Usage_Hours:   parseFloat(document.getElementById('avgHours').value),
    Daily_Unlocks:           parseInt(document.getElementById('unlocks').value),
    Study_Hours:             parseInt(document.getElementById('study').value),
    Physical_Activity_Hours: parseInt(document.getElementById('activity').value),
    Sleep_Hours_Per_Night:   parseFloat(document.getElementById('sleep').value),
    Stress_Level:            document.getElementById('stress').value,
  };
}

/* ─────────────────────────────────────────────
   15. FORM SUBMISSION
───────────────────────────────────────────── */
function initForm() {
  document.getElementById('predictForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorBanner();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('https://mental-health-api-1-0sm3.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        let detail = `Server error ${res.status}`;
        try {
          const err = await res.json();
          if (err.detail) detail = typeof err.detail === 'string'
            ? err.detail : JSON.stringify(err.detail);
        } catch(_) {}
        throw new Error(detail);
      }

      const data = await res.json();
      if (typeof data.predicted_score === 'undefined')
        throw new Error('Unexpected response format from API.');

      renderResult(data);

    } catch (err) {
      showErrorBanner(
        err instanceof TypeError
          ? 'Could not reach the prediction service. Please try again shortly.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  });
}

/* ─────────────────────────────────────────────
   16. RESET
───────────────────────────────────────────── */
function initReset() {
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('resultCard').classList.add('hidden');
    document.getElementById('predictForm').reset();

    document.getElementById('avgHoursVal').textContent  = '3';
    document.getElementById('sleepVal').textContent     = '7';
    document.getElementById('avgHoursGlow').style.width = '12.5%';
    document.getElementById('avgHoursGlow').style.background = 'linear-gradient(90deg,#10b981,#059669)';
    document.getElementById('sleepGlow').style.width   = '58.3%';

    document.querySelectorAll('.stress-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('stress').value = '';

    document.querySelectorAll('.field-card').forEach(c =>
      c.classList.remove('field-filled', 'field-error')
    );
    document.querySelectorAll('.field-err').forEach(e => {
      e.textContent = ''; e.classList.add('hidden');
    });

    document.getElementById('progressBar').style.width  = '0%';
    document.getElementById('progressPct').textContent  = '0%';

    const dimContainer = document.getElementById('dimensionInsights');
    if (dimContainer) {
      dimContainer.classList.add('hidden');
      dimContainer.innerHTML = '';
    }
    const tsEl = document.getElementById('assessedAt');
    if (tsEl) tsEl.classList.add('hidden');

    hideErrorBanner();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ─────────────────────────────────────────────
   17. LIVE VALIDATION CLEAR
───────────────────────────────────────────── */
function initLiveValidationClear() {
  document.querySelectorAll('.field-input, .field-select').forEach(el => {
    ['input','change'].forEach(evt =>
      el.addEventListener(evt, () => {
        clearFieldError(el.closest('.field-card'));
        updateProgress();
      })
    );
  });
}

/* ─────────────────────────────────────────────
   18. SCROLL ANIMATIONS
───────────────────────────────────────────── */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const i  = parseInt(el.dataset.animIdx || 0);
        el.animate(
          [
            { opacity: '0', transform: 'translateY(18px)' },
            { opacity: '1', transform: 'translateY(0)'   },
          ],
          { duration: 420, delay: i * 45, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' }
        );
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.field-card').forEach((card, i) => {
    card.dataset.animIdx = i;
    obs.observe(card);
  });
}

/* ─────────────────────────────────────────────
   19. SERVER CONNECTION (PRE-WARM & KEEP-ALIVE)
───────────────────────────────────────────── */
async function initServerConnection() {
  const indicator = document.getElementById('serverStatus');
  
  if (indicator) {
    indicator.textContent = 'Connecting to backend API...';
    indicator.classList.remove('hidden');
  }

  // Pre-warm fetch to wake up Render on page load
  try {
    await fetch('https://mental-health-api-1-0sm3.onrender.com/health');
    if (indicator) {
      indicator.textContent = 'Server connection established ✓';
      setTimeout(() => indicator.classList.add('hidden'), 2500);
    }
  } catch (error) {
    if (indicator) {
      indicator.textContent = 'Server is waking up — first analysis may be slower';
    }
  }

  // Keep-alive ping every 10 minutes
  setInterval(() => {
    fetch('https://mental-health-api-1-0sm3.onrender.com/health').catch(() => {});
  }, 10 * 60 * 1000); 
}

/* ─────────────────────────────────────────────
   20. BOOT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  ParticleEngine.init();
  initStickyHeader();
  initRangeInputs();
  initStressChips();
  initProgress();
  initFieldStates();
  initLiveValidationClear();
  initErrorBanner();
  initForm();
  initReset();
  initScrollAnimations();
  initServerConnection();
});