/* =========================================
   KenyaVest – app.js
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
// Close nav on link click
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
// ESC key
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Navbar buttons
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
function submitReg(e) {
  e.preventDefault();
  closeModal();
  showToast('✅ Account created! Welcome to KenyaVest 🎉');
}
function submitLog(e) {
  e.preventDefault();
  closeModal();
  showToast('✅ Login successful! Redirecting to dashboard…');
}
function submitContact(e) {
  e.preventDefault();
  e.target.reset();
  showToast('✅ Message sent! We\'ll reply within 24 hours.');
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

  // close all
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
calcProfit(); // init

// ---- COUNTER ANIMATION ----
function animateCount(el) {
  const target = parseInt(el.dataset.to);
  const duration = 1800;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString('en-KE');
  }, 16);
}

// Observe counters
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      counterObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.count').forEach(el => counterObs.observe(el));

// ---- SCROLL REVEAL ----
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

// Add reveal class to major section elements
document.querySelectorAll(
  '.feat-card, .plan-card, .step-card, .testi-card, .about-feat, .ci-item'
).forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = `opacity .6s ease ${(i % 6) * .08}s, transform .6s ease ${(i % 6) * .08}s`;
  el.classList.add('scroll-reveal');
  revealObs.observe(el);
});

// CSS rule for revealed state (injected)
const style = document.createElement('style');
style.textContent = '.scroll-reveal.revealed { opacity:1 !important; transform:translateY(0) !important; }';
document.head.appendChild(style);

// ---- ACTIVE NAV ON SCROLL ----
const sections = document.querySelectorAll('section[id], div[id]');
const navLinksAll = document.querySelectorAll('.nav-link');

const navObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinksAll.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'var(--green)';
        }
      });
    }
  });
}, { threshold: 0.45 });

sections.forEach(s => navObs.observe(s));

// ---- SMOOTH SCROLL FOR ALL ANCHOR LINKS ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80; // navbar height
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth'
      });
    }
  });
});

// ---- LIVE TICKER UPDATE (simulated) ----
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
