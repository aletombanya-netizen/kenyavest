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

  // Init
  fetchProfile();
  fetchTransactions();

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

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.href = '/login.html';
  });
});
