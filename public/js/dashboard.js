document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const balanceAmount = document.getElementById('balanceAmount');
  const transactionList = document.getElementById('transactionList');
  
  const depositModal = document.getElementById('depositModal');
  const openDepositModal = document.getElementById('openDepositModal');
  const closeModal = document.getElementById('closeModal');
  const depositForm = document.getElementById('depositForm');
  const depositMsg = document.getElementById('depositMsg');

  // Fetch User Profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        userNameDisplay.textContent = `Welcome, ${data.name}`;
        balanceAmount.textContent = data.balance.toFixed(2);
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/payments/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        transactionList.innerHTML = '';
        if (data.length === 0) {
          transactionList.innerHTML = '<li>No transactions found.</li>';
          return;
        }

        data.forEach(tx => {
          const li = document.createElement('li');
          const date = new Date(tx.createdAt).toLocaleDateString();
          li.innerHTML = `
            <div>
              <strong>${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</strong>
              <div style="font-size: 0.8rem; color: #aaa;">${date} • Ref: ${tx.reference}</div>
            </div>
            <div style="text-align: right;">
              <div>KES ${tx.amount}</div>
              <div class="status-${tx.status}" style="font-size: 0.8rem;">${tx.status.toUpperCase()}</div>
            </div>
          `;
          transactionList.appendChild(li);
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Active Investments
  const fetchInvestments = async () => {
    const investmentsList = document.getElementById('investmentsList');
    try {
      const res = await fetch('/api/investments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      investmentsList.innerHTML = '';
      if (!res.ok || data.length === 0) {
        investmentsList.innerHTML = '<p style="color:#aaa">No active investments. Click "Invest Now" to get started!</p>';
        return;
      }
      data.forEach(inv => {
        const div = document.createElement('div');
        div.style = 'display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #333;';
        div.innerHTML = `
          <div>
            <strong>${inv.planName} Plan</strong>
            <div style="font-size:0.8rem; color:#aaa;">Started ${new Date(inv.startDate).toLocaleDateString()} • ${inv.status.toUpperCase()}</div>
          </div>
          <div style="text-align:right;">
            <div>KES ${inv.amountInvested.toLocaleString()} invested</div>
            <div style="color:#4ade80; font-size:0.85rem;">+KES ${inv.dailyReturn}/day</div>
          </div>
        `;
        investmentsList.appendChild(div);
      });
    } catch (err) {
      investmentsList.innerHTML = '<p style="color:#f87171">Failed to load investments.</p>';
    }
  };

  // Init
  fetchProfile();
  fetchTransactions();
  fetchInvestments();

  // Modal Logic
  openDepositModal.addEventListener('click', () => depositModal.style.display = 'flex');
  closeModal.addEventListener('click', () => depositModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === depositModal) depositModal.style.display = 'none';
  });

  // Deposit Submit
  depositForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('depositAmount').value;
    const phone = document.getElementById('depositPhone').value;
    depositMsg.textContent = 'Initiating payment...';
    depositMsg.style.color = '#F4C430';

    try {
      const res = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, phone })
      });
      const data = await res.json();

      if (res.ok) {
        depositMsg.textContent = 'Check your phone to enter M-Pesa PIN.';
        depositMsg.style.color = '#4ade80';
        setTimeout(() => {
          depositModal.style.display = 'none';
          fetchTransactions(); // Refresh list to show pending tx
        }, 3000);
      } else {
        depositMsg.textContent = data.message || 'Failed to initiate payment.';
        depositMsg.style.color = '#f87171';
      }
    } catch (err) {
      depositMsg.textContent = 'Network error.';
      depositMsg.style.color = '#f87171';
    }
  });

  // Withdraw Modal Logic
  const withdrawModal = document.getElementById('withdrawModal');
  const openWithdrawModal = document.getElementById('openWithdrawModal');
  const closeWithdrawModal = document.getElementById('closeWithdrawModal');
  const withdrawForm = document.getElementById('withdrawForm');
  const withdrawMsg = document.getElementById('withdrawMsg');

  openWithdrawModal.addEventListener('click', () => withdrawModal.style.display = 'flex');
  closeWithdrawModal.addEventListener('click', () => withdrawModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === withdrawModal) withdrawModal.style.display = 'none';
  });

  withdrawForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('withdrawAmount').value;
    const phone = document.getElementById('withdrawPhone').value;
    withdrawMsg.textContent = 'Submitting request...';
    withdrawMsg.style.color = '#F4C430';

    try {
      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, phone })
      });
      const data = await res.json();

      if (res.ok) {
        withdrawMsg.textContent = data.message || 'Withdrawal requested successfully!';
        withdrawMsg.style.color = '#4ade80';
        setTimeout(() => {
          withdrawModal.style.display = 'none';
          fetchTransactions();
          fetchProfile(); // Refresh balance
        }, 2000);
      } else {
        withdrawMsg.textContent = data.message || 'Failed to request withdrawal.';
        withdrawMsg.style.color = '#f87171';
      }
    } catch (err) {
      withdrawMsg.textContent = 'Network error.';
      withdrawMsg.style.color = '#f87171';
    }
  });

  // Invest Modal Logic
  const PLAN_RATES = { starter: 0.03, pro: 0.05, elite: 0.08 };
  const investModal = document.getElementById('investModal');
  const openInvestModal = document.getElementById('openInvestModal');
  const closeInvestModal = document.getElementById('closeInvestModal');
  const investForm = document.getElementById('investForm');
  const investMsg = document.getElementById('investMsg');
  const investPlan = document.getElementById('investPlan');
  const investAmount = document.getElementById('investAmount');
  const roiPreview = document.getElementById('roiPreview');

  openInvestModal.addEventListener('click', () => investModal.style.display = 'flex');
  closeInvestModal.addEventListener('click', () => investModal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === investModal) investModal.style.display = 'none';
  });

  const updateROIPreview = () => {
    const rate = PLAN_RATES[investPlan.value] || 0;
    const amount = parseFloat(investAmount.value) || 0;
    if (amount > 0) {
      roiPreview.textContent = `Daily return: KES ${(amount * rate).toFixed(2)}`;
    } else {
      roiPreview.textContent = '';
    }
  };
  investPlan.addEventListener('change', updateROIPreview);
  investAmount.addEventListener('input', updateROIPreview);

  investForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    investMsg.textContent = 'Activating plan...';
    investMsg.style.color = '#F4C430';
    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planKey: investPlan.value, amount: investAmount.value })
      });
      const data = await res.json();
      if (res.ok) {
        investMsg.textContent = data.message;
        investMsg.style.color = '#4ade80';
        setTimeout(() => {
          investModal.style.display = 'none';
          investForm.reset();
          roiPreview.textContent = '';
          fetchProfile();
          fetchInvestments();
          fetchTransactions();
        }, 2000);
      } else {
        investMsg.textContent = data.message || 'Failed to activate plan.';
        investMsg.style.color = '#f87171';
      }
    } catch (err) {
      investMsg.textContent = 'Network error.';
      investMsg.style.color = '#f87171';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.href = '/login.html';
  });
});
