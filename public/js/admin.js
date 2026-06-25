document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Very basic frontend check, actual protection is in the backend
  const adminNameDisplay = document.getElementById('adminNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  const errorMsg = document.getElementById('errorMsg');
  const transactionsTableBody = document.getElementById('transactionsTableBody');
  const usersTableBody = document.getElementById('usersTableBody');

  adminNameDisplay.textContent = `Welcome, ${userInfo.name || 'Admin'}`;

  const fetchAdminData = async () => {
    try {
      // Fetch Users
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!usersRes.ok) {
        if (usersRes.status === 401) {
            errorMsg.textContent = "You do not have admin privileges. Redirecting...";
            setTimeout(() => window.location.href = '/dashboard.html', 2000);
            return;
        }
        throw new Error('Failed to fetch users');
      }
      const users = await usersRes.json();
      
      usersTableBody.innerHTML = '';
      users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${user.name}</td>
          <td>${user.phone}</td>
          <td>${user.role}</td>
          <td>${user.balance.toFixed(2)}</td>
          <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        `;
        usersTableBody.appendChild(tr);
      });

      // Fetch Transactions
      const txRes = await fetch('/api/admin/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!txRes.ok) throw new Error('Failed to fetch transactions');
      const transactions = await txRes.json();

      transactionsTableBody.innerHTML = '';
      transactions.forEach(tx => {
        const tr = document.createElement('tr');
        const userName = tx.user ? tx.user.name : 'Unknown User';
        const userPhone = tx.user ? tx.user.phone : '';
        
        let actionButtons = '';
        if (tx.status === 'pending') {
          actionButtons = `
            <button class="btn-sm btn-approve" onclick="updateTx('${tx._id}', 'success')">Approve</button>
            <button class="btn-sm btn-reject" onclick="updateTx('${tx._id}', 'rejected')">Reject</button>
          `;
        }

        tr.innerHTML = `
          <td>${new Date(tx.createdAt).toLocaleString()}</td>
          <td>${userName} <br><small style="color:#aaa">${userPhone}</small></td>
          <td>${tx.type.toUpperCase()}</td>
          <td>${tx.amount}</td>
          <td>${tx.reference}</td>
          <td class="status-${tx.status}">${tx.status.toUpperCase()}</td>
          <td>${actionButtons}</td>
        `;
        transactionsTableBody.appendChild(tr);
      });

    } catch (err) {
      errorMsg.textContent = err.message;
    }
  };

  // Expose function to global scope for inline onclick handlers
  window.updateTx = async (txId, newStatus) => {
    if (!confirm(`Are you sure you want to mark this transaction as ${newStatus}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/transactions/${txId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchAdminData(); // Refresh data
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update transaction');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  fetchAdminData();

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.href = '/login.html';
  });
});
