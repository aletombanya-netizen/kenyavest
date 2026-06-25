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

// ---- TAB SWITCH ----
function switchTab(tab) {
  const isReg = tab === 'register';
  document.getElementById('regForm').style.display = isReg ? 'block' : 'none';
  document.getElementById('logForm').style.display = isReg ? 'none'  : 'block';
  document.getElementById('tabReg').classList.toggle('active', isReg);
  document.getElementById('tabLog').classList.toggle('active', !isReg);
}

// ---- FORM SUBMISSIONS ----
async function submitReg(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[type="text"]').value;
  const phone = form.querySelector('input[type="tel"]').value;
  const password = form.querySelector('input[type="password"]').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      closeModal();
      showToast('✅ Account created! Redirecting to dashboard...');
      setTimeout(() => window.location.href = '/dashboard.html', 1500);
    } else {
      showToast('❌ ' + (data.message || 'Registration failed'));
    }
  } catch (err) {
    showToast('❌ Network error');
  }
}

async function submitLog(e) {
  e.preventDefault();
  const form = e.target;
  const phone = form.querySelector('input[type="tel"]').value;
  const password = form.querySelector('input[type="password"]').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      closeModal();
      showToast('✅ Login successful! Redirecting to dashboard...');
      setTimeout(() => window.location.href = '/dashboard.html', 1500);
    } else {
      showToast('❌ ' + (data.message || 'Login failed'));
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
  const amount = parseFloat(document.getElementById('cAmount').value) || 0;
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

// ---- LIVE TICKER UPDATE ----
const tickerValues = [
  ['BTC/KES', 12589000, 0.06],
  ['ETH/KES', 455000, 0.04],
  ['NSE 20', 1847, 0.02],
  ['USD/KES', 129.5, 0.005],
];
function updateTicker() {
  tickerValues.forEach(item => {
    const change = (Math.random() - 0.45) * item[1] * item[2];
    item[1] = Math.max(1, item[1] + change);
  });
}
setInterval(updateTicker, 5000);

// ---- COUNTDOWN TIMER ----
(function startCountdown() {
  // Store target in sessionStorage so it persists on reload but resets on new session
  const KEY = 'kv_cd_end';
  let endTime = sessionStorage.getItem(KEY);
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

// ---- PWA SERVICE WORKER ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
