/* ═══════════════════════════════════════════════
   MindMetric — Core Execution Framework
   ═══════════════════════════════════════════════ */

'use strict';

// Global Configuration Context
const CONFIG = {
  apiBase: 'https://mental-health-api-1-0sm3.onrender.com',
  totalFields: 12
};

/* ─────────────────────────────────────────────
   1. Dynamic Theme Architecture
───────────────────────────────────────────── */
const ThemeManager = (() => {
  const root = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');
  const sun = document.getElementById('sunIcon');
  const moon = document.getElementById('moonIcon');

  function applyTheme(isDark) {
    if (isDark) {
      root.classList.add('dark');
      sun.classList.remove('hidden');
      moon.classList.add('hidden');
    } else {
      root.classList.remove('dark');
      sun.classList.add('hidden');
      moon.classList.remove('hidden');
    }
    localStorage.setItem('mm_theme', isDark ? 'dark' : 'light');
  }

  function init() {
    const cached = localStorage.getItem('mm_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(cached === 'dark' || (!cached && systemPrefersDark));

    toggleBtn.addEventListener('click', () => {
      applyTheme(!root.classList.contains('dark'));
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────
   2. High-Performance Particle Engine
───────────────────────────────────────────── */
const ParticleEngine = (() => {
  const canvas = document.getElementById('particleCanvas');
  let ctx, particles = [], animationId = null;
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      alpha: Math.random() * 0.3 + 0.05,
      hue: [140, 240, 35][Math.floor(Math.random() * 3)]
    };
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    const isDark = document.documentElement.classList.contains('dark');
    const targetLuminance = isDark ? 70 : 45;

    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 65%, ${targetLuminance}%, ${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = W;
      else if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      else if (p.y > H) p.y = 0;
    }
    animationId = requestAnimationFrame(render);
  }

  function init() {
    // Disable rendering operations entirely on mobile/low-spec architectures
    if (window.innerWidth < 768 || navigator.maxTouchPoints > 0) {
      canvas.style.display = 'none';
      return;
    }
    ctx = canvas.getContext('2d', { alpha: true });
    resize();
    window.addEventListener('resize', resize, { passive: true });
    particles = Array.from({ length: 25 }, createParticle);
    render();
  }

  return { init };
})();

/* ─────────────────────────────────────────────
   3. Centralized Interactive State Controller
───────────────────────────────────────────── */
const StateController = (() => {
  const elements = {};

  function init() {
    const ids = [
      'age', 'gender', 'country', 'academic', 'stress', 'platform',
      'purpose', 'avgHours', 'unlocks', 'study', 'activity', 'sleep',
      'progressBar', 'progressPct', 'submitBtn'
    ];
    ids.forEach(id => {
      elements[id] = document.getElementById(id);
    });

    // Enforce passive listener paradigms for smooth scroll metrics
    window.addEventListener('scroll', () => {
      document.getElementById('mainHeader').classList.toggle('scrolled', window.scrollY > 15);
    }, { passive: true });

    initRangeTrackers();
    initValidationListeners();
  }

  function initRangeTrackers() {
    const hoursInput = elements['avgHours'];
    const hoursGlow = document.getElementById('avgHoursGlow');
    const hoursVal = document.getElementById('avgHoursVal');

    function updateHours() {
      const val = parseFloat(hoursInput.value);
      hoursVal.textContent = val;
      hoursGlow.style.width = `${(val / 24) * 100}%`;
      
      // Update warning gradient thresholds smoothly
      if (val > 8.0) {
        hoursGlow.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
      } else if (val > 4.0) {
        hoursGlow.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
      } else {
        hoursGlow.style.background = 'linear-gradient(90deg, #10b981, #059669)';
      }
    }
    hoursInput.addEventListener('input', updateHours);
    updateHours();

    const sleepInput = elements['sleep'];
    const sleepGlow = document.getElementById('sleepGlow');
    const sleepVal = document.getElementById('sleepVal');

    function updateSleep() {
      const val = parseFloat(sleepInput.value);
      sleepVal.textContent = val;
      sleepGlow.style.width = `${(val / 12) * 100}%`;
    }
    sleepInput.addEventListener('input', updateSleep);
    updateSleep();
  }

  function calculateProgress() {
    const monitored = [
      'age', 'gender', 'country', 'academic', 'stress', 'platform',
      'purpose', 'avgHours', 'unlocks', 'study', 'activity', 'sleep'
    ];
    let filled = 0;
    monitored.forEach(id => {
      if (elements[id] && elements[id].value.trim() !== '') {
        filled++;
      }
    });

    const completionRate = Math.round((filled / CONFIG.totalFields) * 100);
    elements['progressBar'].style.width = `${completionRate}%`;
    elements['progressPct'].textContent = `${completionRate}%`;
  }

  function initValidationListeners() {
    const inputs = document.querySelectorAll('.field-input, .field-select');
    inputs.forEach(el => {
      ['change', 'blur', 'input'].forEach(evt => {
        el.addEventListener(evt, () => {
          const card = el.closest('.field-card');
          if (el.value.trim()) {
            card.classList.add('field-filled');
            card.classList.remove('field-error');
            const err = card.querySelector('.field-err');
            if (err) err.classList.add('hidden');
          } else {
            card.classList.remove('field-filled');
          }
          calculateProgress();
        });
      });
    });

    // Stress Chip Bindings
    const chips = document.querySelectorAll('.stress-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        elements['stress'].value = chip.dataset.value;

        const parent = chip.closest('.field-card');
        parent.classList.add('field-filled');
        parent.classList.remove('field-error');
        const err = parent.querySelector('.field-err');
        if (err) err.classList.add('hidden');

        calculateProgress();
      });
    });
  }

  return { init, calculateProgress, elements };
})();

/* ─────────────────────────────────────────────
   4. Validation & Error Framework
───────────────────────────────────────────── */
const Validator = (() => {
  function showFieldError(card, msg) {
    if (!card) return;
    card.classList.add('field-error');
    card.classList.remove('field-filled');
    const err = card.querySelector('.field-err');
    if (err) {
      err.textContent = msg;
      err.classList.remove('hidden');
    }
    card.animate(
      [
        { transform: 'translate3d(0, 0, 0)' },
        { transform: 'translate3d(-5px, 0, 0)' },
        { transform: 'translate3d(5px, 0, 0)' },
        { transform: 'translate3d(0, 0, 0)' }
      ],
      { duration: 240, easing: 'ease' }
    );
  }

  function validate() {
    let isValid = true;
    let focusTarget = null;

    const numericValidations = [
      { id: 'age', label: 'Age', min: 5, max: 100 },
      { id: 'unlocks', label: 'Daily Unlocks', min: 0, max: 500 },
      { id: 'study', label: 'Study Hours', min: 0, max: 20 },
      { id: 'activity', label: 'Activity Hours', min: 0, max: 16 }
    ];

    numericValidations.forEach(item => {
      const el = StateController.elements[item.id];
      const card = el.closest('.field-card');
      const val = el.value.trim();

      if (!val) {
        showFieldError(card, `${item.label} is required.`);
        isValid = false;
        if (!focusTarget) focusTarget = card;
        return;
      }

      const num = Number(val);
      if (isNaN(num) || num < item.min || num > item.max) {
        showFieldError(card, `Must be a valid integer between ${item.min} and ${item.max}.`);
        isValid = false;
        if (!focusTarget) focusTarget = card;
      }
    });

    // Time budget check
    if (isValid) {
      const screen = parseFloat(StateController.elements['avgHours'].value) || 0;
      const study = parseFloat(StateController.elements['study'].value) || 0;
      const activity = parseFloat(StateController.elements['activity'].value) || 0;
      const sleep = parseFloat(StateController.elements['sleep'].value) || 0;
      const totalAllocated = screen + study + activity + sleep;

      if (totalAllocated > 24) {
        ['avgHours', 'study', 'activity', 'sleep'].forEach(id => {
          const card = StateController.elements[id].closest('.field-card');
          showFieldError(card, `Allocation total is ${totalAllocated.toFixed(1)}h. Must not exceed 24h.`);
        });
        isValid = false;
        focusTarget = StateController.elements['avgHours'].closest('.field-card');
      }
    }

    // Select box validation
    const selectFields = ['gender', 'country', 'academic', 'platform', 'purpose'];
    selectFields.forEach(id => {
      const el = StateController.elements[id];
      const card = el.closest('.field-card');
      if (!el.value) {
        showFieldError(card, 'Please select an option.');
        isValid = false;
        if (!focusTarget) focusTarget = card;
      }
    });

    // Stress Chip validation
    const stressVal = StateController.elements['stress'].value;
    if (!stressVal) {
      const card = StateController.elements['stress'].closest('.field-card');
      showFieldError(card, 'Please select a stress level.');
      isValid = false;
      if (!focusTarget) focusTarget = card;
    }

    if (focusTarget) {
      focusTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
  }

  return { validate };
})();

/* ─────────────────────────────────────────────
   5. Dynamic Response Renderer
───────────────────────────────────────────── */
const ResultRenderer = (() => {
  function getScoreTheme(score) {
    if (score >= 8.0) return {
      color: '#10b981', text: '#34d399', label: 'Optimal Wellbeing',
      gradient: ['#34d399', '#059669'],
      recs: ["Perfect dynamic work-rest limits maintained. Keep this baseline steady.", "Promote current strategy parameters to peers."]
    };
    if (score >= 5.0) return {
      color: '#fbbf24', text: '#f59e0b', label: 'Moderate Wellbeing',
      gradient: ['#fbbf24', '#f59e0b'],
      recs: ["Implement 30-minute cognitive screen-free buffers post sunset.", "Establish routine physical output patterns."]
    };
    if (score >= 3.0) return {
      color: '#fb923c', text: '#f97316', label: 'Below Average',
      gradient: ['#fb923c', '#f97316'],
      recs: ["Strictly curtail visual social network exposure under 3h daily.", "Re-establish consistent recovery window allocations."]
    };
    return {
      color: '#f87171', text: '#ef4444', label: 'Critical Priority',
      gradient: ['#f87171', '#dc2626'],
      recs: ["Treatment of 8 hours sleep as a non-negotiable critical protocol.", "Engage with psychological or medical guidance networks immediately."]
    };
  }

  function getLocalDimensionFeedback(dimensionName, val) {
    if (val >= 8.0) {
      switch (dimensionName) {
        case 'Sleep': return "Incredible sleep optimization. Sleep cycle is exceptionally healthy.";
        case 'Physical Activity': return "Outstanding somatic movement habits.";
        case 'Screen Time': return "Superb control of digital allocation variables.";
        default: return "Excellent metric baseline.";
      }
    } else if (val >= 5.0) {
      return `Adequate ${dimensionName.toLowerCase()} indicators. Dynamic adjustments could improve efficiency.`;
    } else {
      return `Attention Needed: Negatively impacting your standard wellness levels.`;
    }
  }

  function render(response) {
    const rawScore = response.predicted_score;
    const score = Math.min(Math.max(rawScore, 0.0), 10.0);
    const theme = getScoreTheme(score);
    const isDark = document.documentElement.classList.contains('dark');

    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');

    // Trigger GPU-Accelerated entry transition
    resultCard.style.willChange = 'transform, opacity';
    resultCard.animate([
      { opacity: 0, transform: 'translate3d(0, 20px, 0)' },
      { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ], { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });

    // Handle Sleep-specific warnings (including strictly 0 hours)
    const sleepValue = parseFloat(StateController.elements['sleep'].value) || 0;
    if (sleepValue === 0) {
      showSleepToast("EMERGENCY ALERT: 0h sleep recorded. Total sleep deprivation leads to severe physical hazards.");
    } else if (sleepValue < 6.0) {
      showSleepToast(`Warning: Rest duration (${sleepValue}h) is below the recovery threshold.`);
    } else {
      hideSleepToast();
    }

    // Dynamic Gradient updates on main SVG layout
    const stop1 = document.querySelector('#ringGrad stop:first-child');
    const stop2 = document.querySelector('#ringGrad stop:last-child');
    if (stop1) stop1.setAttribute('stop-color', theme.gradient[0]);
    if (stop2) stop2.setAttribute('stop-color', theme.gradient[1]);

    const circle = document.getElementById('scoreCircle');
    const circumference = 326.7;
    // Batch rendering offset updates to prevent visual stuttering
    requestAnimationFrame(() => {
      circle.style.strokeDashoffset = circumference - (score / 10) * circumference;
    });

    // Score Counter interpolation
    const display = document.getElementById('scoreDisplay');
    const duration = 1200, startTime = performance.now();
    
    function updateCounter(now) {
      const elapsed = Math.min((now - startTime) / duration, 1);
      const easeVal = 1 - Math.pow(1 - elapsed, 3); // Cubic easeOut
      display.textContent = (easeVal * score).toFixed(1);
      if (elapsed < 1) requestAnimationFrame(updateCounter);
      else display.textContent = score.toFixed(1);
    }
    requestAnimationFrame(updateCounter);
    display.style.color = isDark ? theme.text : theme.color;

    // Set header states
    const badge = document.getElementById('resultBadge');
    badge.textContent = theme.label;
    badge.style.background = `${theme.color}15`;
    badge.style.borderColor = `${theme.color}30`;
    badge.style.color = isDark ? theme.text : theme.color;

    document.getElementById('scoreLabel').textContent = response.score_label || theme.label;
    document.getElementById('scoreDesc').textContent = response.note;

    // Metric visualizer pills batch rendering
    const trackedPills = [
      { label: 'Sleep', val: `${sleepValue}h` },
      { label: 'Screen', val: `${StateController.elements['avgHours'].value}h` },
      { label: 'Stress', val: StateController.elements['stress'].value },
      { label: 'Activity', val: `${StateController.elements['activity'].value}h` },
      { label: 'Study', val: `${StateController.elements['study'].value}h` },
      { label: 'Unlocks', val: StateController.elements['unlocks'].value }
    ];

    document.getElementById('metricPills').innerHTML = trackedPills.map((p, idx) => `
      <div class="flex flex-col p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm" style="animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: ${idx * 0.03}s">
        <span class="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold mb-0.5">${p.label}</span>
        <span class="text-xs font-black text-slate-800 dark:text-slate-100">${p.val}</span>
      </div>
    `).join('');

    // Dynamic Render dimensions returned from microservices validation
    const container = document.getElementById('dimensionInsights');
    if (response.dimensions && response.dimensions.length > 0) {
      container.innerHTML = response.dimensions.map((dim, idx) => {
        const pct = (dim.score / 10 * 100).toFixed(0);
        const markerColor = dim.score >= 7.5 ? 'bg-emerald-500' : dim.score >= 5.0 ? 'bg-amber-500' : 'bg-rose-500';
        const dynamicFeedback = getLocalDimensionFeedback(dim.dimension, dim.score);
        
        return `
          <div class="space-y-1" style="animation: slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: ${idx * 0.04}s">
            <div class="flex justify-between items-end">
              <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300">${dim.dimension}</span>
              <span class="text-xs font-black text-slate-900 dark:text-white">${dim.score}<span class="text-slate-400 font-medium text-[10px]">/10</span></span>
            </div>
            <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full ${markerColor} rounded-full" style="width: 0%; transition: width 1s cubic-bezier(0.16, 1, 0.3, 1)" data-pct="${pct}"></div>
            </div>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">${dim.insight || dynamicFeedback}</p>
          </div>
        `;
      }).join('');
      container.classList.remove('hidden');

      // Trigger width animation in next frame layout calculation
      requestAnimationFrame(() => {
        container.querySelectorAll('[data-pct]').forEach(bar => {
          bar.style.width = `${bar.dataset.pct}%`;
        });
      });
    }

    // Set assessment clock timestamp
    if (response.assessed_at) {
      const stamp = document.getElementById('assessedAt');
      stamp.textContent = `Assessed: ${new Date(response.assessed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      stamp.classList.remove('hidden');
    }

    // Target recommendations
    const recsList = response.note && score < 3.0 ? [response.note, ...theme.recs] : theme.recs;
    document.getElementById('recItems').innerHTML = recsList.map((rec, idx) => `
      <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50" style="animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: ${idx * 0.05}s">
        <div class="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">${rec}</p>
      </div>
    `).join('');

    // Trigger visual confetti celebrations on high performance metrics
    if (score >= 7.5) {
      triggerConfetti();
    }

    // Ensure smooth viewport focus on entry bounds
    setTimeout(() => {
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  function showSleepToast(msg) {
    const toast = document.getElementById('sleepOutToast');
    document.getElementById('sleepOutMessage').textContent = msg;
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  }

  function hideSleepToast() {
    const toast = document.getElementById('sleepOutToast');
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0');
  }

  function triggerConfetti() {
    const confettiCanvas = document.getElementById('confettiCanvas');
    const context = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = ['#10b981', '#34d399', '#6366f1', '#fbbf24', '#f87171'];
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: -20,
      r: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 3,
      opacity: 1
    }));

    function step() {
      context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.opacity > 0) {
          alive = true;
          context.beginPath();
          context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          context.fillStyle = p.color;
          context.globalAlpha = p.opacity;
          context.fill();

          p.x += p.vx;
          p.y += p.vy;
          p.opacity -= 0.006;
        }
      });
      context.globalAlpha = 1.0;
      if (alive) requestAnimationFrame(step);
      else context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    step();
  }

  return { render, hideSleepToast };
})();

/* ─────────────────────────────────────────────
   6. Connection, Warm-up & Lifecycles
───────────────────────────────────────────── */
const ConnectionEngine = (() => {
  const statusEl = document.getElementById('serverStatus');
  let healthCheckerId = null;

  async function checkWarmup() {
    statusEl.textContent = 'Synchronizing secure server gateway...';
    statusEl.classList.remove('hidden');

    try {
      const response = await fetch(`${CONFIG.apiBase}/health`, { mode: 'cors' });
      if (response.ok) {
        statusEl.textContent = 'Security handshake successful ✓';
        statusEl.classList.add('text-emerald-500');
        setTimeout(() => statusEl.classList.add('hidden'), 3000);
      }
    } catch (_) {
      statusEl.textContent = 'Inference server waking up — Handshake pending...';
      statusEl.classList.add('text-amber-500');
    }
  }

  function startKeepAlive() {
    // Keep container metrics alive via 5-minute health check pings
    healthCheckerId = setInterval(async () => {
      try {
        await fetch(`${CONFIG.apiBase}/health`, { mode: 'cors' });
      } catch (_) {}
    }, 5 * 60 * 1000);
  }

  return { checkWarmup, startKeepAlive };
})();

/* ─────────────────────────────────────────────
   7. Form Submission Lifecycle Controller
───────────────────────────────────────────── */
const FormManager = (() => {
  let isSubmitting = false;
  let timerInterval = null;

  function setLoading(state) {
    isSubmitting = state;
    const btn = StateController.elements['submitBtn'];
    const textWrap = document.getElementById('btnText');
    const slowHint = document.getElementById('slowHint');

    btn.disabled = state;
    if (state) {
      const start = performance.now();
      textWrap.innerHTML = `
        <span class="flex items-center gap-2">
          Analyzing Framework (<span id="liveTimer">0.0</span>s)
        </span>
      `;
      const liveTimer = document.getElementById('liveTimer');
      timerInterval = setInterval(() => {
        liveTimer.textContent = ((performance.now() - start) / 1000).toFixed(1);
      }, 100);

      window._slowTimerFallback = setTimeout(() => {
        slowHint.classList.remove('hidden');
      }, 4000);
    } else {
      clearInterval(timerInterval);
      clearTimeout(window._slowTimerFallback);
      slowHint.classList.add('hidden');
      textWrap.innerHTML = `
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813 a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
        </svg>
        Assess My Wellness
      `;
    }
  }

  function buildPayload() {
    return {
      Age: parseInt(StateController.elements['age'].value, 10),
      Gender: StateController.elements['gender'].value,
      Country: StateController.elements['country'].value,
      Academic_Level: StateController.elements['academic'].value,
      Most_Used_Platform: StateController.elements['platform'].value,
      Purpose_Of_Use: StateController.elements['purpose'].value,
      Avg_Daily_Usage_Hours: parseFloat(StateController.elements['avgHours'].value),
      Daily_Unlocks: parseInt(StateController.elements['unlocks'].value, 10),
      Study_Hours: parseInt(StateController.elements['study'].value, 10),
      Physical_Activity_Hours: parseInt(StateController.elements['activity'].value, 10),
      Sleep_Hours_Per_Night: parseFloat(StateController.elements['sleep'].value),
      Stress_Level: StateController.elements['stress'].value
    };
  }

  function getCacheKey(payload) {
    return `mm_cache_v2_${JSON.stringify(payload)}`;
  }

  function init() {
    const form = document.getElementById('predictForm');
    const errorBanner = document.getElementById('errorBanner');
    const closeError = document.getElementById('closeError');

    closeError.addEventListener('click', () => errorBanner.classList.add('hidden'));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      errorBanner.classList.add('hidden');
      if (!Validator.validate()) return;

      const payload = buildPayload();
      const cacheKey = getCacheKey(payload);
      const cachedResponse = localStorage.getItem(cacheKey);

      // Return instant local cache response if payload properties match
      if (cachedResponse) {
        try {
          ResultRenderer.render(JSON.parse(cachedResponse));
          return;
        } catch (_) {
          localStorage.removeItem(cacheKey);
        }
      }

      setLoading(true);

      try {
        const response = await fetch(`${CONFIG.apiBase}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          let errDetail = `Status: ${response.status}`;
          try {
            const body = await response.json();
            if (body.detail) errDetail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
          } catch (_) {}
          throw new Error(errDetail);
        }

        const data = await response.json();
        // Save computed prediction securely in client index context
        localStorage.setItem(cacheKey, JSON.stringify(data));
        ResultRenderer.render(data);

      } catch (err) {
        errorBanner.classList.remove('hidden');
        document.getElementById('errorMsg').textContent = err.message.includes('Failed to fetch')
          ? 'Network timeout reaching connection server. Verify active web status.'
          : err.message;
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } finally {
        setLoading(false);
      }
    });

    // Reset workflow
    document.getElementById('resetBtn').addEventListener('click', () => {
      const card = document.getElementById('resultCard');
      card.animate([
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        { opacity: 0, transform: 'translate3d(0, 20px, 0)' }
      ], { duration: 250, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
        card.classList.add('hidden');
      };

      form.reset();

      // Clear layout overrides
      document.querySelectorAll('.stress-chip').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.field-card').forEach(c => c.classList.remove('field-filled', 'field-error'));
      document.querySelectorAll('.field-err').forEach(e => e.classList.add('hidden'));

      // Re-evaluate initial progress ranges
      StateController.elements['avgHours'].value = 3;
      StateController.elements['sleep'].value = 7;
      
      const dispatchInput = new Event('input');
      StateController.elements['avgHours'].dispatchEvent(dispatchInput);
      StateController.elements['sleep'].dispatchEvent(dispatchInput);

      StateController.calculateProgress();
      ResultRenderer.hideSleepToast();
      errorBanner.classList.add('hidden');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return { init };
})();

/* ─────────────────────────────────────────────
   8. Boot Hook
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  ParticleEngine.init();
  StateController.init();
  FormManager.init();
  ConnectionEngine.checkWarmup();
  ConnectionEngine.startKeepAlive();

  const closeToast = document.getElementById('closeToast');
  if (closeToast) {
    closeToast.addEventListener('click', ResultRenderer.hideSleepToast);
  }
});