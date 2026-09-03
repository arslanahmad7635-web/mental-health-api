/* ═══════════════════════════════════════════════
   MindMetric — Application Logic (Fixed)
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
   Kept strictly pointer-events:none via CSS,
   extra safety via JS attribute too.
───────────────────────────────────────────── */
const ParticleEngine = (() => {
  const canvas = document.getElementById('particleCanvas');
  const ctx    = canvas.getContext('2d');
  let particles = [];
  let W, H;

  // Force non-interactive
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

  // Number fields
  const numFields = [
    { id: 'age',      label: 'Age',           min: 0, max: 120 },
    { id: 'unlocks',  label: 'Daily Unlocks',  min: 0 },
    { id: 'study',    label: 'Study Hours',    min: 0 },
    { id: 'activity', label: 'Activity Hours', min: 0 },
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

  // Select fields
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

  // Stress
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
  const btn     = document.getElementById('submitBtn');
  const txtWrap = document.getElementById('btnText');
  const spinner = document.getElementById('btnSpinner');

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
  } else {
    txtWrap.innerHTML = `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813
          a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09
          L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
      </svg>
      Assess My Wellness`;
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
   12. SCORE THEME
───────────────────────────────────────────── */
function getScoreTheme(score) {
  if (score >= 7.5) return {
    color: '#10b981', darkColor: '#34d399',
    gradStart: '#34d399', gradEnd: '#059669',
    label: 'Excellent Wellbeing 🌟',
    desc: 'Your habits reflect strong mental wellbeing. Keep nurturing the routines that support your energy, focus, and happiness.',
    badge: '🌟 Excellent',
    recs: [
      { emoji:'🧘', text:"Maintain your mindfulness practices — they're clearly working well." },
      { emoji:'💪', text:'Keep up your physical activity routine to sustain mental clarity.' },
      { emoji:'😴', text:'Your sleep habits are solid — protect them as a top priority.' },
      { emoji:'🌿', text:'Share your healthy habits with friends and family around you.' },
    ],
  };
  if (score >= 5) return {
    color: '#f59e0b', darkColor: '#fbbf24',
    gradStart: '#fbbf24', gradEnd: '#f59e0b',
    label: 'Moderate Wellbeing 👍',
    desc: 'Your wellbeing is in a reasonable range, but there are areas worth improving — sleep, screen time, or physical activity could all benefit.',
    badge: '👍 Moderate',
    recs: [
      { emoji:'📱', text:'Try reducing daily screen time by 30 minutes and observe the difference.' },
      { emoji:'🏃', text:'Adding 15-20 minutes of daily movement can significantly boost mood.' },
      { emoji:'😴', text:'Aim for 7-9 hours of quality sleep consistently each night.' },
      { emoji:'🧠', text:'Practice short mindfulness breaks between study or work sessions.' },
    ],
  };
  if (score >= 3) return {
    color: '#f97316', darkColor: '#fb923c',
    gradStart: '#fb923c', gradEnd: '#f97316',
    label: 'Below Average ⚠️',
    desc: 'Some lifestyle patterns may be affecting your mental health. Consider reviewing your daily habits and seeking professional guidance.',
    badge: '⚠️ Below Average',
    recs: [
      { emoji:'🔕', text:'Set firm screen-free periods, especially in the hour before bed.' },
      { emoji:'🤝', text:'Reach out to a trusted friend, mentor, or counselor to talk through stress.' },
      { emoji:'🌅', text:'Establish a morning routine — even 10 minutes of fresh air helps.' },
      { emoji:'📓', text:'Start journaling daily to identify and process recurring stressors.' },
    ],
  };
  return {
    color: '#ef4444', darkColor: '#f87171',
    gradStart: '#f87171', gradEnd: '#dc2626',
    label: 'Needs Attention 🚨',
    desc: "Your score suggests significant stress or lifestyle imbalances. Speaking with a healthcare professional is strongly encouraged.",
    badge: '🚨 Needs Attention',
    recs: [
      { emoji:'🏥', text:'Speak with a mental health professional as soon as possible.' },
      { emoji:'📵', text:'Immediately reduce social media usage — start with a 1-day digital detox.' },
      { emoji:'💤', text:'Prioritize sleep above everything else — 7-9 hours is non-negotiable.' },
      { emoji:'🆘', text:'Reach out to a support line or trusted person in your life today.' },
    ],
  };
}

/* ─────────────────────────────────────────────
   13. RENDER RESULT
───────────────────────────────────────────── */
function renderResult(score) {
  const clamped = Math.min(Math.max(score, 0), 10);
  const theme   = getScoreTheme(clamped);
  const isDark  = document.documentElement.classList.contains('dark');

  // Show result card
  const card = document.getElementById('resultCard');
  card.classList.remove('hidden');

  // SVG gradient colors
  const gs = document.querySelector('#ringGrad stop:first-child');
  const ge = document.querySelector('#ringGrad stop:last-child');
  if (gs) gs.setAttribute('stop-color', theme.gradStart);
  if (ge) ge.setAttribute('stop-color', theme.gradEnd);

  // Ring animation
  const circle = document.getElementById('scoreCircle');
  const circum = 326.7;
  setTimeout(() => {
    circle.style.strokeDashoffset = circum - (clamped / 10) * circum;
  }, 120);

  // Animated number counter
  const scoreDisplay = document.getElementById('scoreDisplay');
  const t0 = performance.now();
  const dur = 1300;
  (function countUp(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    scoreDisplay.textContent = (e * clamped).toFixed(1);
    if (p < 1) requestAnimationFrame(countUp);
    else scoreDisplay.textContent = clamped.toFixed(1);
  })(t0);
  scoreDisplay.style.color = isDark ? theme.darkColor : theme.color;

  // Badge
  const badge = document.getElementById('resultBadge');
  badge.textContent        = theme.badge;
  badge.style.background   = `${theme.color}18`;
  badge.style.borderColor  = `${theme.color}35`;
  badge.style.color        = isDark ? theme.darkColor : theme.color;

  // Headline
  const headline = document.getElementById('scoreLabel');
  headline.textContent = theme.label;
  headline.style.color = isDark ? theme.darkColor : theme.color;

  document.getElementById('scoreDesc').textContent = theme.desc;

  // Metric pills
  const pills = [
    { label:'Sleep',    val: document.getElementById('sleep').value    + ' hrs', emoji:'😴' },
    { label:'Screen',   val: document.getElementById('avgHours').value + ' hrs', emoji:'📱' },
    { label:'Stress',   val: document.getElementById('stress').value,             emoji:'⚡' },
    { label:'Activity', val: document.getElementById('activity').value + ' hrs',  emoji:'🏃' },
    { label:'Study',    val: document.getElementById('study').value    + ' hrs',  emoji:'📚' },
    { label:'Unlocks',  val: document.getElementById('unlocks').value  + 'x',     emoji:'🔓' },
  ];
  document.getElementById('metricPills').innerHTML = pills.map((m, i) =>
    `<span class="metric-pill" style="animation-delay:${i*0.06}s">
       <span>${m.emoji}</span>
       <span class="metric-pill-val">${m.val}</span>
       <span>${m.label}</span>
     </span>`
  ).join('');

  // Mini bars
  const bars = [
    { label:'Sleep',    pct: Math.min(parseFloat(document.getElementById('sleep').value)    / 12, 1), color:'#f59e0b' },
    { label:'Screen',   pct: Math.min(parseFloat(document.getElementById('avgHours').value) / 24, 1), color:'#6366f1' },
    { label:'Activity', pct: Math.min(parseFloat(document.getElementById('activity').value) / 8,  1), color:'#10b981' },
    { label:'Study',    pct: Math.min(parseFloat(document.getElementById('study').value)    / 12, 1), color:'#34d399' },
  ];
  document.getElementById('miniBars').innerHTML = bars.map(b =>
    `<div class="mini-bar-wrap">
       <div class="mini-bar-track">
         <div class="mini-bar-fill" data-pct="${(b.pct*100).toFixed(1)}"
              style="background:${b.color};border-radius:4px;height:0%"></div>
       </div>
       <span class="mini-bar-label">${b.label}</span>
     </div>`
  ).join('');
  setTimeout(() => {
    document.querySelectorAll('.mini-bar-fill').forEach(el => {
      el.style.height = el.dataset.pct + '%';
    });
  }, 450);

  // Recommendations
  document.getElementById('recItems').innerHTML = theme.recs.map((r, i) =>
    `<div class="rec-item" style="animation-delay:${0.1+i*0.08}s">
       <span class="rec-emoji">${r.emoji}</span>
       <span class="rec-text">${r.text}</span>
     </div>`
  ).join('');

  // Top bar
  document.getElementById('resultTopBar').style.background =
    `linear-gradient(90deg,${theme.gradStart},${theme.gradEnd},${theme.color})`;

  // Confetti
  setTimeout(() => launchConfetti(clamped), 500);

  // Scroll to result
  setTimeout(() => card.scrollIntoView({ behavior:'smooth', block:'start' }), 250);
}

/* ─────────────────────────────────────────────
   14. BUILD PAYLOAD  ← unchanged, keeps API intact
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
   15. FORM SUBMISSION  ← API URL unchanged
───────────────────────────────────────────── */
function initForm() {
  document.getElementById('predictForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorBanner();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('https://mental-health-api-uj4w.onender.com', {
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

      renderResult(data.predicted_score);

    } catch (err) {
      showErrorBanner(
        err instanceof TypeError
          ? 'Could not reach the API. Make sure FastAPI is running at http://127.0.0.1:8000'
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
    // Hide result
    document.getElementById('resultCard').classList.add('hidden');

    // Reset form natively
    document.getElementById('predictForm').reset();

    // Re-sync range displays
    document.getElementById('avgHoursVal').textContent  = '3';
    document.getElementById('sleepVal').textContent     = '7';
    document.getElementById('avgHoursGlow').style.width = '12.5%';
    document.getElementById('avgHoursGlow').style.background = 'linear-gradient(90deg,#10b981,#059669)';
    document.getElementById('sleepGlow').style.width   = '58.3%';

    // Clear stress chips
    document.querySelectorAll('.stress-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('stress').value = '';

    // Clear field states
    document.querySelectorAll('.field-card').forEach(c =>
      c.classList.remove('field-filled', 'field-error')
    );
    document.querySelectorAll('.field-err').forEach(e => {
      e.textContent = ''; e.classList.add('hidden');
    });

    // Reset progress
    document.getElementById('progressBar').style.width  = '0%';
    document.getElementById('progressPct').textContent  = '0%';

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
   18. SCROLL ANIMATIONS  ← Fixed: no opacity:0 lock
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
   19. BOOT
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
});