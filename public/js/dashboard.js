/* =====================================================
   KenyaVest — dashboard.js
   ===================================================== */

let TOKEN = null;
try {
  TOKEN = localStorage.getItem('token');
} catch (e) {
  alert("Warning: Your browser is blocking local storage. Please enable cookies to access the dashboard.");
}

if (!TOKEN) window.location.href = '/';

const PLANS = {
  starter: { rate: 0.03 },
  pro:     { rate: 0.05 },
  elite:   { rate: 0.08 },
};

let balanceChartInstance = null;

// ── API helper ───────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (res.status === 401) { localStorage.clear(); window.location.href = '/'; }
  return res.json();
}

// ── Load everything ──────────────────────────────────
async function loadDashboard() {
  const [profile, transactions, investments] = await Promise.all([
    api('GET', '/api/auth/profile'),
    api('GET', '/api/auth/transactions'),
    api('GET', '/api/investments'),
  ]);

  renderProfile(profile);
  renderStats(profile, transactions, investments);
  renderChart(transactions);
  renderInvestments(investments);
  renderTransactions(transactions);
  renderReferral(profile, transactions);
}

// ── Profile ──────────────────────────────────────────
function renderProfile(user) {
  document.getElementById('userNameDisplay').textContent = user.name || 'User';
  document.getElementById('avatarInitial').textContent   = (user.name || 'U')[0].toUpperCase();
  
  const vipColors = { Bronze: '#cd7f32', Silver: '#e2e8f0', Gold: '#F4C430', Platinum: '#a855f7' };
  const vipEl = document.getElementById('vipTierDisplay');
  if (vipEl) {
    vipEl.textContent = user.vipTier || 'BRONZE';
    vipEl.style.color = vipColors[user.vipTier] || '#cd7f32';
  }
}

// ── Stats ────────────────────────────────────────────
function renderStats(user, txs, investments) {
  document.getElementById('balanceAmount').textContent =
    (user.balance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 });

  const totalInvested = investments
    .filter(i => i.status === 'active')
    .reduce((s, i) => s + (i.amountInvested || 0), 0);
  document.getElementById('totalInvested').textContent = totalInvested.toLocaleString('en-KE');

  const totalROI = txs
    .filter(t => t.type === 'roi' && t.status === 'completed')
    .reduce((s, t) => s + (t.amount || 0), 0);
  document.getElementById('totalROI').textContent = totalROI.toLocaleString('en-KE');

  document.getElementById('referralEarnings').textContent =
    (user.referralEarnings || 0).toLocaleString('en-KE');
}

// ── Chart ────────────────────────────────────────────
function renderChart(txs) {
  const ctx = document.getElementById('balanceChart').getContext('2d');

  // Build cumulative balance over time
  const sorted = [...txs]
    .filter(t => ['completed'].includes(t.status))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-30);

  let running = 0;
  const labels = [];
  const data   = [];

  sorted.forEach(t => {
    const sign = ['deposit', 'roi', 'referral'].includes(t.type) ? 1 : -1;
    running += sign * (t.amount || 0);
    labels.push(new Date(t.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }));
    data.push(parseFloat(running.toFixed(2)));
  });

  if (balanceChartInstance) balanceChartInstance.destroy();

  balanceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Balance (KES)',
        data,
        borderColor: '#F4C430',
        backgroundColor: 'rgba(244,196,48,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#F4C430',
        pointRadius: 3,
        tension: 0.4,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `KES ${ctx.parsed.y.toLocaleString('en-KE')}`,
          },
          backgroundColor: '#111622',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleColor: '#8b9ab8',
          bodyColor: '#e8eaf0',
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8b9ab8', font: { size: 10 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#8b9ab8',
            font: { size: 10 },
            callback: v => 'KES ' + v.toLocaleString('en-KE'),
          },
        },
      },
    },
  });
}

// ── Investments ──────────────────────────────────────
function renderInvestments(investments) {
  const el = document.getElementById('investmentsList');
  const active = investments.filter(i => i.status === 'active');
  if (!active.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">🌱</div><p>No active investments yet</p></div>';
    return;
  }
  el.innerHTML = active.map(inv => {
    const start     = new Date(inv.createdAt);
    const end       = new Date(inv.endDate);
    const now       = new Date();
    
    let daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    let planDuration = inv.durationDays || 30;
    
    if (daysElapsed < 0) daysElapsed = 0;
    if (daysElapsed > planDuration) daysElapsed = planDuration;
    
    const daysRemaining = planDuration - daysElapsed;
    const pct = Math.min(100, Math.round((daysElapsed / planDuration) * 100));
    
    return `
      <div class="invest-item">
        <div class="invest-top">
          <span class="invest-plan">📦 ${inv.planName} Plan (Locked)</span>
          <span class="invest-roi">+KES ${(inv.dailyReturn || 0).toLocaleString('en-KE')}/day</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="invest-meta">
          <span>KES ${(inv.amountInvested || 0).toLocaleString('en-KE')} invested</span>
          <span style="color:#F4C430">${daysRemaining} days remaining</span>
        </div>
      </div>`;
  }).join('');
}

// ── Transactions ─────────────────────────────────────
const TX_META = {
  deposit:    { icon: '📥', label: 'M-Pesa Deposit',  cls: 'positive',   iconCls: 'tx-icon-deposit' },
  withdrawal: { icon: '📤', label: 'Withdrawal',       cls: 'negative',   iconCls: 'tx-icon-withdrawal' },
  roi:        { icon: '💸', label: 'Daily ROI',         cls: 'positive',   iconCls: 'tx-icon-roi' },
  investment: { icon: '📦', label: 'Investment',        cls: 'negative',   iconCls: 'tx-icon-investment' },
  referral:   { icon: '🎁', label: 'Referral Bonus',    cls: 'positive',   iconCls: 'tx-icon-referral' },
};

function renderTransactions(txs) {
  const el = document.getElementById('transactionList');
  if (!txs.length) {
    el.innerHTML = '<li class="empty"><div class="empty-icon">📋</div><p>No transactions yet</p></li>';
    return;
  }
  el.innerHTML = txs.slice(0, 20).map(t => {
    const m = TX_META[t.type] || { icon: '❓', label: t.type, cls: '', iconCls: '' };
    const sign = m.cls === 'positive' ? '+' : '-';
    const badge = `<span class="badge badge-${t.status}">${t.status}</span>`;
    return `
      <li class="tx-item">
        <div class="tx-icon ${m.iconCls}">${m.icon}</div>
        <div class="tx-info">
          <div class="tx-label">${m.label}${badge}</div>
          <div class="tx-date">${new Date(t.createdAt).toLocaleString('en-KE', { dateStyle:'medium', timeStyle:'short' })}</div>
        </div>
        <div class="tx-amount ${m.cls}">${sign}KES ${(t.amount||0).toLocaleString('en-KE')}</div>
      </li>`;
  }).join('');
}

// ── Referral ─────────────────────────────────────────
function renderReferral(user, txs) {
  document.getElementById('referralCode').textContent = user.referralCode || '------';
  document.getElementById('refEarnings').textContent  = 'KES ' + (user.referralEarnings || 0).toLocaleString('en-KE');
  const refCount = txs.filter(t => t.type === 'referral' && t.status === 'completed').length;
  document.getElementById('refCount').textContent = refCount;
}

function copyReferral() {
  const code = document.getElementById('referralCode').textContent;
  const url  = `https://kashflowvest.onrender.com?ref=${code}`;
  navigator.clipboard.writeText(url).then(() => showToast('✅ Referral link copied!', 'success'));
}

// ── Modals ────────────────────────────────────────────
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
  clearMsgs();
}

function clearMsgs() {
  ['depositMsg','withdrawMsg','investMsg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.className = 'modal-msg'; }
  });
}

document.getElementById('openDepositModal').addEventListener('click', () => {
  document.getElementById('depositModal').classList.add('open');
});
document.getElementById('openWithdrawModal').addEventListener('click', () => {
  document.getElementById('withdrawModal').classList.add('open');
});
document.getElementById('openInvestModal').addEventListener('click', () => {
  document.getElementById('investModal').classList.add('open');
  updateROIPreview();
});

document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeAllModals(); });
});

// ── ROI Preview ───────────────────────────────────────
function updateROIPreview() {
  const plan   = PLANS[document.getElementById('investPlan').value] || PLANS.starter;
  const amount = parseFloat(document.getElementById('investAmount').value) || 0;
  const daily  = (amount * plan.rate).toFixed(2);
  document.getElementById('roiPreview').textContent =
    amount > 0 ? `📈 Daily return: KES ${parseFloat(daily).toLocaleString('en-KE')}` : '';
}

// ── Deposit Form ──────────────────────────────────────
document.getElementById('depositForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msgEl  = document.getElementById('depositMsg');
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const phone  = document.getElementById('depositPhone').value.trim();
  msgEl.textContent = 'Initiating M-Pesa payment...';
  msgEl.className   = 'modal-msg';
  try {
    const data = await api('POST', '/api/payments/deposit', { amount, phone });
    if (data.message) {
      msgEl.textContent = '✅ ' + data.message;
      msgEl.className   = 'modal-msg success';
      e.target.reset();
      setTimeout(() => { closeAllModals(); loadDashboard(); }, 3000);
    } else {
      msgEl.textContent = '❌ ' + (data.message || 'Failed');
      msgEl.className   = 'modal-msg error';
    }
  } catch {
    msgEl.textContent = '❌ Network error. Please try again.';
    msgEl.className   = 'modal-msg error';
  }
});

// ── Withdraw Form ─────────────────────────────────────
document.getElementById('withdrawForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msgEl  = document.getElementById('withdrawMsg');
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const phone  = document.getElementById('withdrawPhone').value.trim();
  msgEl.textContent = 'Submitting request...';
  msgEl.className   = 'modal-msg';
  try {
    const data = await api('POST', '/api/payments/withdraw', { amount, phone });
    if (data.transaction || data.message?.includes('submitted')) {
      msgEl.textContent = '✅ ' + (data.message || 'Withdrawal request submitted!');
      msgEl.className   = 'modal-msg success';
      e.target.reset();
      setTimeout(() => { closeAllModals(); loadDashboard(); }, 2500);
    } else {
      msgEl.textContent = '❌ ' + (data.message || 'Failed');
      msgEl.className   = 'modal-msg error';
    }
  } catch {
    msgEl.textContent = '❌ Network error. Please try again.';
    msgEl.className   = 'modal-msg error';
  }
});

// ── Invest Form ───────────────────────────────────────
document.getElementById('investForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msgEl  = document.getElementById('investMsg');
  const planKey = document.getElementById('investPlan').value;
  const amount  = parseFloat(document.getElementById('investAmount').value);
  msgEl.textContent = 'Activating your plan...';
  msgEl.className   = 'modal-msg';
  try {
    const data = await api('POST', '/api/investments', { planKey, amount });
    if (data.investment || data.message?.toLowerCase().includes('activated')) {
      msgEl.textContent = '✅ ' + (data.message || 'Investment activated!');
      msgEl.className   = 'modal-msg success';
      e.target.reset();
      setTimeout(() => { closeAllModals(); loadDashboard(); }, 2500);
    } else {
      msgEl.textContent = '❌ ' + (data.message || 'Failed');
      msgEl.className   = 'modal-msg error';
    }
  } catch {
    msgEl.textContent = '❌ Network error. Please try again.';
    msgEl.className   = 'modal-msg error';
  }
});

// ── Logout ────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/';
});

// ── Toast ─────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Responsive 2-col ─────────────────────────────────
function setGridCols() {
  const twoCol = document.getElementById('twoCol');
  if (twoCol) twoCol.style.gridTemplateColumns = window.innerWidth < 700 ? '1fr' : '1fr 1fr';
}
window.addEventListener('resize', setGridCols);
setGridCols();

// ── Init ──────────────────────────────────────────────
loadDashboard();
