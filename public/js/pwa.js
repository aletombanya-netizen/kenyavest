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
