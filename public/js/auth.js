document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const errorMsg = document.getElementById('errorMsg');

  // Check if already logged in
  if (localStorage.getItem('token') && (loginForm || registerForm)) {
    window.location.href = '/dashboard.html';
  }

  const showError = (msg) => {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    } else {
      alert(msg);
    }
  };

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;

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
          window.location.href = '/dashboard.html';
        } else {
          showError(data.message || 'Login failed');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;

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
          window.location.href = '/dashboard.html';
        } else {
          showError(data.message || 'Registration failed');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  }
});
