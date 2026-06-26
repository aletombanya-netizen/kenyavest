document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const otpForm = document.getElementById('otpForm');
  const forgotForm = document.getElementById('forgotForm');
  const resetForm = document.getElementById('resetForm');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const errorMsg = document.getElementById('errorMsg');
  
  const loginSection = document.getElementById('loginSection');
  const registerSection = document.getElementById('registerSection');
  const otpSection = document.getElementById('otpSection');
  const forgotSection = document.getElementById('forgotSection');
  const resetSection = document.getElementById('resetSection');
  const verifyPhoneSection = document.getElementById('verifyPhoneSection');
  
  const showForgotBtn = document.getElementById('showForgotBtn');
  const showVerifyBtn = document.getElementById('showVerifyBtn');
  const verifyPhoneForm = document.getElementById('verifyPhoneForm');

  if (showForgotBtn) {
    showForgotBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginSection) loginSection.style.display = 'none';
      if (forgotSection) forgotSection.style.display = 'block';
    });
  }

  if (showVerifyBtn) {
    showVerifyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginSection) loginSection.style.display = 'none';
      if (verifyPhoneSection) verifyPhoneSection.style.display = 'block';
    });
  }

  let currentPhone = '';

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

  const showSuccess = (msg) => {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.color = '#16a34a'; // Green color for success
      errorMsg.style.display = 'block';
      setTimeout(() => {
        errorMsg.style.color = '#ff4c4c'; // Reset back to red
      }, 5000);
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
        } else if (res.status === 403 && data.requiresVerification) {
          currentPhone = data.phone || phone;
          if (loginSection) loginSection.style.display = 'none';
          if (otpSection) otpSection.style.display = 'block';
          showError('Please verify your phone number first.');
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

        if (res.status === 201 && data.requiresVerification) {
          currentPhone = data.phone || phone;
          if (registerSection) registerSection.style.display = 'none';
          if (otpSection) otpSection.style.display = 'block';
          showSuccess('Account created! Please verify your phone number.');
        } else if (res.ok) {
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

  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('otpCode').value.trim();
      
      if (!code || code.length !== 6) return showError('Enter a valid 6-digit OTP');

      try {
        const res = await fetch('/api/auth/verify-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: currentPhone, code })
        });
        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userInfo', JSON.stringify(data));
          window.location.href = '/dashboard.html';
        } else {
          showError(data.message || 'Verification failed');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: currentPhone })
        });
        const data = await res.json();
        
        if (res.ok) {
          showSuccess(data.message || 'New OTP sent.');
        } else {
          showError(data.message || 'Failed to resend OTP');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('forgotPhone').value.trim();
      if (!phone) return showError('Enter your phone number');
      
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        
        if (res.ok) {
          currentPhone = phone;
          if (forgotSection) forgotSection.style.display = 'none';
          if (resetSection) resetSection.style.display = 'block';
          showSuccess(data.message || 'OTP sent!');
        } else {
          showError(data.message || 'Failed to send OTP');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  }

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('resetOtpCode').value.trim();
      const newPassword = document.getElementById('newPassword').value;

      if (!code || code.length !== 6) return showError('Enter a valid 6-digit OTP');
      if (!newPassword || newPassword.length < 8) return showError('Password must be at least 8 characters');

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: currentPhone, code, newPassword })
        });
        const data = await res.json();
        
        if (res.ok) {
          showSuccess(data.message || 'Password reset successful!');
          if (resetSection) resetSection.style.display = 'none';
          if (loginSection) loginSection.style.display = 'block';
        } else {
          showError(data.message || 'Failed to reset password');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  }

  if (verifyPhoneForm) {
    verifyPhoneForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('verifyPhoneInput').value.trim();
      if (!phone) return showError('Enter your phone number');
      
      try {
        const res = await fetch('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        
        if (res.ok) {
          currentPhone = phone;
          if (verifyPhoneSection) verifyPhoneSection.style.display = 'none';
          if (otpSection) otpSection.style.display = 'block';
          showSuccess(data.message || 'Verification OTP sent!');
        } else {
          showError(data.message || 'Failed to send OTP');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  }
});
