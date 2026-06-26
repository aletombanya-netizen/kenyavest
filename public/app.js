/* =========================================
   KenyaVest – app.js  (Inves Theme + Features)
   ========================================= */

// ---- NAVBAR SCROLL ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  document.getElementById('btt').classList.toggle('visible', window.scrollY > 400);
});

// ---- HAMBURGER MENU ----
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ---- MODAL ----
function openModal(tab) {
  document.getElementById('modal').classList.add('active');
  document.body.style.overflow = 'hidden';
  switchTab(tab || 'register');
}
function closeModal() {
  document.getElementById('modal').classList.remove('active');
  document.body.style.overflow = '';
}
function overlayClose(e) {
  if (e.target.id === 'modal') closeModal();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.getElementById('loginBtn').addEventListener('click',       () => openModal('login'));
document.getElementById('registerNavBtn').addEventListener('click', () => openModal('register'));
document.getElementById('heroRegBtn').addEventListener('click',     () => openModal('register'));

// ---- TAB SWITCH (includes extra panels) ----
let _currentEmail = '';

function showPanel(id) {
  ['regForm','logForm','otpForm','forgotForm','resetForm','verifyPhonePanel'].forEach(p => {
    const el = document.getElementById(p);
    if (el) el.style.display = p === id ? 'block' : 'none';
  });
}

function switchTab(tab) {
  const isReg = tab === 'register';
  document.getElementById('tabReg').classList.toggle('active', isReg);
  document.getElementById('tabLog').classList.toggle('active', !isReg);
  showPanel(isReg ? 'regForm' : 'logForm');
}

function openForgotPassword() { showPanel('forgotForm'); }
function openVerifyPhone() { showPanel('verifyPhonePanel'); }

// ---- FORM SUBMISSIONS ----
async function submitReg(e) {
  e.preventDefault();
  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName  = document.getElementById('regLastName').value.trim();
  const name      = `${firstName} ${lastName}`.trim();
  const phone     = document.getElementById('regPhone').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const password  = document.getElementById('pw1').value;

  if (!firstName || !phone || !email || !password) {
    return showToast('❌ Please fill in all required fields');
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, password })
    });
    const data = await res.json();
    
    if (res.status === 201 && data.requiresVerification) {
      _currentEmail = data.email || email;
      showPanel('otpForm');
      showToast('✅ ' + data.message);
      // If the server returned the code directly (no email), show it in the panel
      setOtpHint(data.message);
    } else if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      closeModal();
      showToast('✅ Account created! Redirecting to dashboard...');
      setTimeout(() => window.location.href = '/dashboard.html', 1500);
    } else {
      showToast('❌ ' + (data.message || 'Registration failed'));
    }
  } catch (err) {
    showToast('❌ Network error. Please try again.');
  }
}

async function submitLog(e) {
  try {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('pw2').value;

    if (!email || !password) {
      return showToast('❌ Please enter your email and password');
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      closeModal();
      showToast('✅ Login successful! Redirecting to dashboard...');
      setTimeout(() => window.location.href = '/dashboard.html', 1500);
    } else if (res.status === 403 && data.requiresVerification) {
      _currentEmail = data.email || email;
      showPanel('otpForm');
      showToast('⚠️ ' + data.message);
      setOtpHint(data.message);
    } else {
      showToast('❌ ' + (data.message || 'Login failed'));
    }
  } catch (err) {
    alert("Login Error: " + (err.message || "Network issue"));
    showToast('❌ Network error or JS error: ' + err.message);
  }
}

// Show OTP code hint in verification panel (used when email not configured)
function setOtpHint(msg) {
  let hint = document.getElementById('otpHint');
  if (!hint) return;
  // Extract a 6-digit code from the message if present
  const match = msg.match(/\b(\d{6})\b/);
  if (match) {
    hint.textContent = '🔑 Your code: ' + match[1];
    hint.style.display = 'block';
  } else {
    hint.style.display = 'none';
  }
}

async function submitOTP() {
  const code = document.getElementById('otpCode').value.trim();
  if (!code || code.length !== 6) return showToast('❌ Enter a valid 6-digit OTP');

  try {
    const res = await fetch('/api/auth/verify-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: _currentEmail, code })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      closeModal();
      showToast('✅ Verification successful! Redirecting to dashboard...');
      setTimeout(() => window.location.href = '/dashboard.html', 1500);
    } else {
      showToast('❌ ' + (data.message || 'Verification failed'));
    }
  } catch (err) {
    showToast('❌ Network error');
  }
}

async function resendOTP() {
  try {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: _currentEmail })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('✅ ' + data.message);
    } else {
      showToast('❌ ' + (data.message || 'Failed to resend OTP'));
    }
  } catch (err) {
    showToast('❌ Network error');
  }
}

async function submitVerifyPhone() {
  const email = document.getElementById('verifyPhoneInputModal').value.trim();
  if (!email) return showToast('❌ Enter your email address');

  try {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    
    if (res.ok) {
      _currentEmail = email;
      showToast('✅ Verification OTP sent!');
      showPanel('otpForm');
    } else {
      showToast('❌ ' + (data.message || 'Failed to send OTP'));
    }
  } catch (err) {
    showToast('❌ Network error');
  }
}
async function submitForgotPassword() {
  const email = document.getElementById('forgotPhone').value.trim();
  if (!email) return showToast('❌ Enter your email address');

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    
    if (res.ok) {
      _currentEmail = email;
      showToast('✅ ' + (data.message || 'OTP sent!'));
      showPanel('resetForm');
    } else {
      showToast('❌ ' + (data.message || 'Failed to send OTP'));
    }
  } catch (err) {
    showToast('❌ Network error');
  }
}

async function submitResetPassword() {
  const code = document.getElementById('resetOtp').value.trim();
  const newPassword = document.getElementById('newPassword').value;

  if (!code || code.length !== 6) return showToast('❌ Enter a valid 6-digit OTP');
  if (!newPassword || newPassword.length < 8) return showToast('❌ Password must be at least 8 characters');

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: _currentEmail, code, newPassword })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast('✅ ' + data.message);
      showPanel('logForm');
    } else {
      showToast('❌ ' + (data.message || 'Failed to reset password'));
    }
  } catch (err) {
    showToast('❌ Network error');
  }
}

async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[name="name"], input[placeholder*="name" i], input[placeholder*="Name"]')?.value || form.querySelector('input[type="text"]')?.value;
  const email = form.querySelector('input[type="email"]')?.value;
  const message = form.querySelector('textarea')?.value;

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    const data = await res.json();
    form.reset();
    showToast(res.ok ? `✅ ${data.message}` : `❌ ${data.message || 'Failed to send message'}`);
  } catch (err) {
    showToast('❌ Network error. Please try again.');
  }
}

// ---- PASSWORD TOGGLE ----
function togglePw(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

// ---- TOAST ----
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3800);
}

// ---- FAQ ACCORDION ----
function toggleFaq(btn) {
  const item   = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.faq-a').classList.remove('open');
  });
  if (!isOpen) {
    item.classList.add('open');
    answer.classList.add('open');
  }
}

// ---- PROFIT CALCULATOR ----
function calcProfit() {
  const amountEl = document.getElementById('cAmount');
  const amount = parseFloat(amountEl.value) || 0;
  // Update display label for slider
  const display = document.getElementById('cAmountDisplay');
  if (display) display.textContent = 'KES ' + Math.round(amount).toLocaleString('en-KE');
  const parts  = document.getElementById('cPlan').value.split(',');
  const rate   = parseFloat(parts[0]) / 100;
  const days   = parseInt(parts[1]);
  const daily  = amount * rate;
  const profit = daily * days;
  const total  = amount + profit;
  const fmt = n => 'KES ' + Math.round(n).toLocaleString('en-KE');
  document.getElementById('rDaily').textContent  = fmt(daily);
  document.getElementById('rProfit').textContent = fmt(profit);
  document.getElementById('rTotal').textContent  = fmt(total);
}
calcProfit();

// ---- COUNTER ANIMATION ----
function animateCount(el) {
  const target   = parseInt(el.dataset.to);
  const duration = 1800;
  const step     = target / (duration / 16);
  let current    = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current).toLocaleString('en-KE');
  }, 16);
}
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { animateCount(entry.target); counterObs.unobserve(entry.target); }
  });
}, { threshold: 0.4 });
document.querySelectorAll('.count').forEach(el => counterObs.observe(el));

// ---- SCROLL REVEAL (Enhanced) ----
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll(
  '.feat-card, .plan-card, .step-card, .testi-card, .about-feat, .ci-item, .stat-item, .faq-item'
).forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(32px)';
  el.style.transition = `opacity .65s ease ${(i % 8) * .07}s, transform .65s cubic-bezier(.25,.8,.25,1) ${(i % 8) * .07}s`;
  el.classList.add('scroll-reveal');
  revealObs.observe(el);
});

const style = document.createElement('style');
style.textContent = '.scroll-reveal.revealed { opacity:1 !important; transform:translateY(0) !important; }';
document.head.appendChild(style);

// ---- VANILLA TILT 3D CARDS ----
window.addEventListener('load', () => {
  if (typeof VanillaTilt !== 'undefined' && window.innerWidth > 768) {
    // Plan cards — most dramatic effect
    VanillaTilt.init(document.querySelectorAll('.plan-card'), {
      max: 20,
      speed: 400,
      glare: true,
      'max-glare': 0.35,
      scale: 1.05,
      perspective: 600,
      reset: true,
    });
    // Feature + Step + Testimonial cards — subtler effect
    VanillaTilt.init(document.querySelectorAll('.feat-card, .testi-card, .step-card'), {
      max: 12,
      speed: 500,
      glare: true,
      'max-glare': 0.2,
      scale: 1.03,
      perspective: 800,
      reset: true,
    });
  }
});

// ---- ACTIVE NAV ON SCROLL ----
const sections   = document.querySelectorAll('section[id], div[id]');
const navLinksAll = document.querySelectorAll('.nav-link');
const navObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinksAll.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'var(--gold)';
        }
      });
    }
  });
}, { threshold: 0.45 });
sections.forEach(s => navObs.observe(s));

// ---- SMOOTH SCROLL ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 90,
        behavior: 'smooth'
      });
    }
  });
});

// ---- LIVE CRYPTO TICKER (CoinGecko) ----
const TICKER_CACHE_KEY = 'kv_ticker_cache';
const TICKER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchLivePrices() {
  try {
    const cached = JSON.parse(localStorage.getItem(TICKER_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < TICKER_CACHE_TTL) {
      return cached.data;
    }
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=kes&include_24hr_change=true'
    );
    if (!res.ok) throw new Error('CoinGecko error');
    const raw = await res.json();
    const data = [
      { label: 'BTC/KES', price: raw.bitcoin.kes, change: raw.bitcoin.kes_24h_change },
      { label: 'ETH/KES', price: raw.ethereum.kes, change: raw.ethereum.kes_24h_change },
      { label: 'SOL/KES', price: raw.solana.kes, change: raw.solana.kes_24h_change },
    ];
    localStorage.setItem(TICKER_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    return data;
  } catch(e) {
    // Return fallback simulated values on API failure
    return null;
  }
}

const tickerValues = [
  ['BTC/KES', 12589000, 0.06],
  ['ETH/KES', 455000, 0.04],
  ['SOL/KES', 22000, 0.05],
  ['USD/KES', 129.5, 0.005],
];

function updateTickerDOM(liveData) {
  const track = document.querySelector('.ticker-track');
  if (!track) return;
  let items;
  if (liveData) {
    const fmt = (n) => n >= 1000 ? (n >= 1000000 ? (n/1000000).toFixed(2)+'M' : (n/1000).toFixed(1)+'K') : n.toFixed(2);
    items = liveData.map(d => {
      const sign = d.change >= 0 ? '+' : '';
      const color = d.change >= 0 ? '#1DE9B6' : '#FF5252';
      return `<span class="tick-item"><span class="tick-sym">${d.label}</span> <span class="tick-val" style="color:${color}">${fmt(d.price)} (${sign}${d.change.toFixed(2)}%)</span></span>`;
    });
  } else {
    tickerValues.forEach(item => {
      const change = (Math.random() - 0.45) * item[1] * item[2];
      item[1] = Math.max(1, item[1] + change);
    });
    items = tickerValues.map(([sym, price]) => {
      const fmt = (n) => n >= 1000000 ? (n/1000000).toFixed(2)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : n.toFixed(2);
      return `<span class="tick-item"><span class="tick-sym">${sym}</span> <span class="tick-val">KES ${fmt(price)}</span></span>`;
    });
  }
  // Duplicate for seamless scroll
  const html = items.join('') + items.join('');
  track.innerHTML = html;
}

async function initTicker() {
  const live = await fetchLivePrices();
  updateTickerDOM(live);
  // Refresh from API every 5 minutes
  setInterval(async () => {
    const fresh = await fetchLivePrices();
    updateTickerDOM(fresh);
  }, TICKER_CACHE_TTL);
}

initTicker();
setInterval(() => updateTickerDOM(null), 5000); // fallback animation update

// ---- COUNTDOWN TIMER ----
(function startCountdown() {
  // Store target in sessionStorage so it persists on reload but resets on new session
  const KEY = 'kv_cd_end';
  let endTime = null;
  try {
    endTime = sessionStorage.getItem(KEY);
  } catch(e) {}
  if (!endTime) {
    // random between 6-23 hours from now
    const hours = 6 + Math.floor(Math.random() * 18);
    endTime = Date.now() + hours * 3600 * 1000;
    sessionStorage.setItem(KEY, endTime);
  }
  endTime = parseInt(endTime);

  function tick() {
    const diff = endTime - Date.now();
    if (diff <= 0) {
      // Reset
      sessionStorage.removeItem(KEY);
      startCountdown();
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cdH').textContent = String(h).padStart(2, '0');
    document.getElementById('cdM').textContent = String(m).padStart(2, '0');
    document.getElementById('cdS').textContent = String(s).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
})();

// ---- LIVE PAYOUT NOTIFICATIONS ----
const payoutData = [
  { name: 'Grace W. — Nairobi',    amt: 'KES 8,200'  },
  { name: 'Peter M. — Mombasa',    amt: 'KES 15,500' },
  { name: 'Amina K. — Kisumu',     amt: 'KES 5,750'  },
  { name: 'David O. — Nakuru',     amt: 'KES 22,400' },
  { name: 'Faith N. — Eldoret',    amt: 'KES 9,900'  },
  { name: 'James R. — Thika',      amt: 'KES 31,000' },
  { name: 'Mercy W. — Nyeri',      amt: 'KES 6,300'  },
  { name: 'Collins A. — Kitale',   amt: 'KES 18,700' },
  { name: 'Tabitha K. — Machakos', amt: 'KES 12,100' },
  { name: 'Brian O. — Nairobi',    amt: 'KES 45,000' },
];

function showPayoutPopup() {
  const popup = document.getElementById('payoutPopup');
  const entry = payoutData[Math.floor(Math.random() * payoutData.length)];
  document.getElementById('ppName').textContent = entry.name;
  document.getElementById('ppAmt').textContent  = entry.amt;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 5500);
}

// Show first payout after 4 seconds, then every 12-18 seconds
setTimeout(() => {
  showPayoutPopup();
  setInterval(() => {
    showPayoutPopup();
  }, 12000 + Math.random() * 6000);
}, 4000);

