/* =====================================================
   KenyaVest — pwa.js
   Handles service worker registration and install prompt
   ===================================================== */

let deferredPrompt = null;

// ── Register Service Worker ────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered:', reg.scope);

        // Check for updates every 60 seconds
        setInterval(() => reg.update(), 60 * 1000);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

// ── Capture the Install Prompt ─────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show install button(s) across the page
  document.querySelectorAll('.pwa-install-btn').forEach((btn) => {
    btn.style.display = 'inline-flex';
  });

  console.log('[PWA] Install prompt captured — ready to show.');
});

// ── Trigger Install ────────────────────────────────────────────────
function triggerInstall() {
  if (!deferredPrompt) {
    alert('To install KenyaVest: open your browser menu and tap "Add to Home Screen".');
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choice) => {
    console.log('[PWA] User choice:', choice.outcome);
    if (choice.outcome === 'accepted') {
      document.querySelectorAll('.pwa-install-btn').forEach((btn) => {
        btn.style.display = 'none';
      });
    }
    deferredPrompt = null;
  });
}

// ── Hide install button once installed ────────────────────────────
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed successfully!');
  document.querySelectorAll('.pwa-install-btn').forEach((btn) => {
    btn.style.display = 'none';
  });
  deferredPrompt = null;
});

// ── Global WhatsApp Support Widget ─────────────────────────────────
// This injects a beautiful floating WhatsApp button onto every page.
// Update the phone number to your actual support number!
window.addEventListener('DOMContentLoaded', () => {
  const waPhone = '254700000000'; // <--- UPDATE YOUR NUMBER HERE (Include 254, no +)
  const waMessage = encodeURIComponent('Hello KenyaVest Support, I need some help.');
  
  const waHTML = `
    <a href="https://wa.me/${waPhone}?text=${waMessage}" target="_blank" id="wa-widget" title="Chat with Support">
      <svg viewBox="0 0 32 32" width="32" height="32" fill="white">
        <path d="M16.05 2.15A13.84 13.84 0 002.2 16c0 2.45.64 4.8 1.83 6.9L2 30l7.25-1.9a13.78 13.78 0 006.8 1.78h.02A13.85 13.85 0 0029.9 16.03a13.8 13.8 0 00-4.06-9.8 13.83 13.83 0 00-9.79-4.08zM16.05 4.5c3.08 0 5.98 1.2 8.16 3.39 2.17 2.18 3.37 5.08 3.37 8.15a11.51 11.51 0 01-11.53 11.52h-.01c-2.02 0-4-.53-5.74-1.55l-.41-.25-4.26 1.12 1.14-4.16-.27-.43A11.47 11.47 0 014.55 16c0-6.35 5.17-11.5 11.5-11.5zm6.33 15.65c-.34-.17-2.04-1-2.35-1.12-.32-.11-.55-.17-.78.17-.23.34-.89 1.11-1.09 1.34-.2.23-.4.26-.74.09-.35-.18-1.46-.54-2.78-1.72-1.02-.91-1.71-2.04-1.91-2.38-.2-.35-.02-.53.15-.7.15-.15.34-.4.51-.6.18-.2.24-.34.35-.57.11-.23.06-.43-.03-.6-.08-.17-.78-1.89-1.07-2.58-.28-.68-.56-.59-.77-.6h-.66c-.23 0-.6.09-.92.43-.32.34-1.2 1.18-1.2 2.87 0 1.7 1.24 3.34 1.41 3.57.17.23 2.44 3.73 5.91 5.23 2.3 1.01 3.19 1.08 4.3 1.02 1.17-.06 3.73-1.52 4.25-3 .52-1.47.52-2.73.37-3-.15-.26-.55-.43-.89-.6z"/>
      </svg>
    </a>
  `;
  
  const waCSS = `
    #wa-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      background: #25D366;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
      z-index: 9999;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      animation: wa-pulse 2s infinite;
    }
    #wa-widget:hover {
      transform: scale(1.1);
      animation: none;
    }
    @keyframes wa-pulse {
      0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.6); }
      70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
      100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
    }
    @media (max-width: 768px) {
      #wa-widget {
        bottom: 16px;
        right: 16px;
        width: 50px;
        height: 50px;
      }
      #wa-widget svg {
        width: 28px;
        height: 28px;
      }
    }
  `;

  document.head.insertAdjacentHTML('beforeend', \`<style>\${waCSS}</style>\`);
  document.body.insertAdjacentHTML('beforeend', waHTML);
});
