const nodemailer = require('nodemailer');

// Create transporter — uses env vars if available, else logs to console
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    return null; // Email not configured — will log instead
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const FROM = `KenyaVest <${process.env.EMAIL_USER || 'noreply@kashflowvest.onrender.com'}>`;

const sendMail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL - not configured] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[Email Error]', err.message);
  }
};

// ── Email Templates ────────────────────────────────────────────────

const sendWelcomeEmail = (user) =>
  sendMail({
    to: user.email,
    subject: '🎉 Welcome to KenyaVest!',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#4ade80,#22c55e);padding:30px;text-align:center">
          <h1 style="margin:0;color:#000;font-size:28px">KenyaVest</h1>
          <p style="margin:6px 0 0;color:#004d20;font-weight:600">Kenya's #1 Investment Platform</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#4ade80;margin-top:0">Welcome, ${user.name}! 🎉</h2>
          <p>Your KenyaVest account has been created successfully. You're now part of over 50,000 Kenyans growing their wealth daily.</p>
          <p><strong>Your referral code:</strong> <code style="background:#1a2235;padding:4px 10px;border-radius:6px;color:#4ade80;font-size:16px">${user.referralCode}</code></p>
          <p>Share this code with friends and earn <strong>10% of their first deposit</strong> instantly!</p>
          <a href="https://kashflowvest.onrender.com" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#4ade80,#22c55e);color:#000;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">Start Investing →</a>
          <p style="margin-top:24px;color:#8b9ab8;font-size:12px">If you didn't create this account, you can safely ignore this email.</p>
        </div>
      </div>`,
  });

const sendDepositConfirmation = (user, amount) =>
  sendMail({
    to: user.email,
    subject: '✅ M-Pesa Deposit Initiated — KenyaVest',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="background:#111622;padding:30px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <h2 style="color:#4ade80;margin:0">Deposit Initiated 💰</h2>
        </div>
        <div style="padding:32px">
          <p>Hi ${user.name}, your M-Pesa STK push of <strong style="color:#4ade80">KES ${amount.toLocaleString()}</strong> has been initiated.</p>
          <p>Please check your phone and enter your M-Pesa PIN to complete the deposit.</p>
          <p style="color:#8b9ab8;font-size:12px">Your balance will be updated automatically once the payment is confirmed.</p>
        </div>
      </div>`,
  });

const sendROICreditEmail = (user, amount) =>
  sendMail({
    to: user.email,
    subject: '💸 Daily ROI Credited — KenyaVest',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="background:#111622;padding:30px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <h2 style="color:#4ade80;margin:0">Daily Return Credited 💸</h2>
        </div>
        <div style="padding:32px">
          <p>Great news, ${user.name}! Your daily investment return of <strong style="color:#4ade80">KES ${amount.toLocaleString()}</strong> has been credited to your account.</p>
          <p>Your balance is growing — log in to invest more or withdraw your earnings.</p>
          <a href="https://kashflowvest.onrender.com/dashboard.html" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#4ade80,#22c55e);color:#000;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">View Dashboard →</a>
        </div>
      </div>`,
  });

const sendWithdrawalUpdateEmail = (user, amount, status) =>
  sendMail({
    to: user.email,
    subject: `${status === 'completed' ? '✅' : '❌'} Withdrawal ${status === 'completed' ? 'Approved' : 'Rejected'} — KenyaVest`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="background:#111622;padding:30px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <h2 style="color:${status === 'completed' ? '#4ade80' : '#ef4444'};margin:0">
            Withdrawal ${status === 'completed' ? 'Approved ✅' : 'Rejected ❌'}
          </h2>
        </div>
        <div style="padding:32px">
          <p>Hi ${user.name}, your withdrawal request of <strong>KES ${amount.toLocaleString()}</strong> has been <strong>${status === 'completed' ? 'approved and processed' : 'rejected by our team'}</strong>.</p>
          ${status === 'completed'
            ? '<p>The funds will be sent to your M-Pesa number within a few minutes.</p>'
            : '<p>Your balance has been restored. If you believe this is a mistake, please contact support.</p>'}
          <a href="https://kashflowvest.onrender.com/dashboard.html" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#4ade80,#22c55e);color:#000;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">View Dashboard →</a>
        </div>
      </div>`,
  });

const sendOTPEmail = (phone, code, purpose) =>
  sendMail({
    to: phone, // fallback — normally would be email
    subject: `${purpose === 'reset' ? '🔑 Password Reset' : '📱 Phone Verification'} — KenyaVest`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="padding:32px;text-align:center">
          <h2 style="color:#4ade80">Your OTP Code</h2>
          <div style="font-size:40px;font-weight:700;letter-spacing:12px;color:#fff;background:#1a2235;padding:20px;border-radius:12px;margin:20px 0">${code}</div>
          <p>This code expires in <strong>10 minutes</strong>. Never share it with anyone.</p>
        </div>
      </div>`,
  });

module.exports = {
  sendWelcomeEmail,
  sendDepositConfirmation,
  sendROICreditEmail,
  sendWithdrawalUpdateEmail,
  sendOTPEmail,
};
