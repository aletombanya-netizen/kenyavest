const { Resend } = require('resend');

// Configure Resend — uses RESEND_API_KEY env var
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'KenyaVest <noreply@kashflowvest.site>';
const APP_URL    = process.env.APP_URL || 'https://kenyavest.onrender.com';

/**
 * Send an email via Resend.
 * Returns true if sent successfully, false otherwise.
 */
const sendMail = async ({ to, subject, html }) => {
  if (!resend) {
    console.log(`[EMAIL - Resend not configured] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return false;
    }

    console.log(`[EMAIL - Sent] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (err) {
    console.error('[Resend Error]', err.message);
    return false;
  }
};

// ── Shared Layout ────────────────────────────────────────────────────
const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KenyaVest</title>
</head>
<body style="margin:0;padding:0;background:#0a0d14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0d14;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#F4C430,#D4A017);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-size:26px;font-weight:900;color:#0B1120;letter-spacing:-0.5px;">💰 KenyaVest</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#3d2a00;font-weight:600;">Kenya's Premier Investment Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#111622;padding:36px 32px;border-left:1px solid rgba(255,255,255,0.07);border-right:1px solid rgba(255,255,255,0.07);">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0d1220;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border:1px solid rgba(255,255,255,0.07);border-top:none;">
            <p style="margin:0;font-size:12px;color:#4a5568;">© ${new Date().getFullYear()} KenyaVest. All rights reserved.</p>
            <p style="margin:8px 0 0;font-size:11px;color:#374151;">If you didn't request this email, you can safely ignore it.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Shared Styles ───────────────────────────────────────────────────
const btn = (href, label) =>
  `<a href="${href}" style="display:inline-block;margin-top:20px;background:linear-gradient(135deg,#F4C430,#D4A017);color:#000;padding:13px 30px;border-radius:10px;font-weight:800;font-size:14px;text-decoration:none;letter-spacing:0.2px;">${label}</a>`;

const highlight = (text) =>
  `<strong style="color:#F4C430;">${text}</strong>`;

const badge = (text, color = '#F4C430') =>
  `<span style="display:inline-block;background:rgba(244,196,48,0.12);color:${color};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700;border:1px solid rgba(244,196,48,0.2);">${text}</span>`;

// ── Email Templates ──────────────────────────────────────────────────

const sendWelcomeEmail = (user) =>
  sendMail({
    to: user.email,
    subject: '🎉 Welcome to KenyaVest — Your Investment Journey Starts Now!',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#F4C430;">Welcome aboard, ${user.name}! 🎉</h2>
      <p style="margin:0 0 20px;color:#8b9ab8;font-size:14px;">Your account has been verified and you're ready to start earning.</p>

      <div style="background:rgba(244,196,48,0.06);border:1px solid rgba(244,196,48,0.15);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:12px;color:#8b9ab8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">YOUR REFERRAL CODE</p>
        <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:6px;color:#F4C430;">${user.referralCode}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#8b9ab8;">Share this with friends and earn <strong style="color:#fff;">10% of their first deposit</strong> instantly!</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:8px 8px 0 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="color:#8b9ab8;font-size:13px;">📈 Plans from</span>
            <strong style="color:#fff;float:right;font-size:13px;">30% daily returns</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="color:#8b9ab8;font-size:13px;">💸 Capital returned</span>
            <strong style="color:#fff;float:right;font-size:13px;">At plan maturity</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:0 0 8px 8px;">
            <span style="color:#8b9ab8;font-size:13px;">📱 Withdrawals via</span>
            <strong style="color:#4ade80;float:right;font-size:13px;">M-Pesa</strong>
          </td>
        </tr>
      </table>

      ${btn(`${APP_URL}/dashboard.html`, '🚀 Start Investing Now →')}
    `),
  });

const sendOTPEmail = (email, code, purpose) =>
  sendMail({
    to: email,
    subject: purpose === 'reset'
      ? '🔑 Your Password Reset Code — KenyaVest'
      : '✉️ Verify Your KenyaVest Account',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#F4C430;">${purpose === 'reset' ? '🔑 Reset Your Password' : '✉️ Verify Your Email'}</h2>
      <p style="margin:0 0 28px;color:#8b9ab8;font-size:14px;">${purpose === 'reset'
        ? 'Enter the code below to reset your KenyaVest password.'
        : 'Enter the code below to verify your account and start investing.'
      }</p>

      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;background:#0B1120;border:2px solid rgba(244,196,48,0.4);border-radius:14px;padding:22px 32px;">
          <p style="margin:0 0 6px;font-size:11px;color:#8b9ab8;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your Code</p>
          <p style="margin:0;font-size:44px;font-weight:900;letter-spacing:16px;color:#fff;font-family:'Courier New',monospace;">${code}</p>
        </div>
      </div>

      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:14px 18px;margin-bottom:16px;">
        <p style="margin:0;font-size:13px;color:#f87171;">⏱️ This code expires in <strong>10 minutes</strong>. Never share it with anyone — KenyaVest staff will never ask for it.</p>
      </div>
    `),
  });

const sendDepositConfirmation = (user, amount) =>
  sendMail({
    to: user.email,
    subject: '💰 M-Pesa Deposit Initiated — KenyaVest',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#4ade80;">Deposit Initiated 💰</h2>
      <p style="margin:0 0 24px;color:#8b9ab8;font-size:14px;">Hi ${user.name}, your M-Pesa STK push has been sent to your phone.</p>

      <div style="background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.15);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#8b9ab8;text-transform:uppercase;letter-spacing:1px;">Amount</p>
        <p style="margin:0;font-size:36px;font-weight:900;color:#4ade80;">KES ${Number(amount).toLocaleString()}</p>
      </div>

      <p style="color:#e8eaf0;font-size:14px;">📱 <strong>Check your phone</strong> — enter your M-Pesa PIN when prompted to complete the deposit.</p>
      <p style="color:#8b9ab8;font-size:13px;">Your balance will be updated automatically once the payment is confirmed by Safaricom.</p>

      ${btn(`${APP_URL}/dashboard.html`, 'View Dashboard →')}
    `),
  });

const sendROICreditEmail = (user, amount) =>
  sendMail({
    to: user.email,
    subject: '💸 Daily Return Credited — KenyaVest',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#F4C430;">Daily Return Credited! 💸</h2>
      <p style="margin:0 0 24px;color:#8b9ab8;font-size:14px;">Great news, ${user.name}! Your investment is paying off.</p>

      <div style="background:rgba(244,196,48,0.07);border:1px solid rgba(244,196,48,0.2);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#8b9ab8;text-transform:uppercase;letter-spacing:1px;">Credited to your balance</p>
        <p style="margin:0;font-size:36px;font-weight:900;color:#F4C430;">KES ${Number(amount).toLocaleString()}</p>
      </div>

      <p style="color:#e8eaf0;font-size:14px;">Your balance is growing daily. Log in to invest more or withdraw your earnings to M-Pesa.</p>

      ${btn(`${APP_URL}/dashboard.html`, 'View Dashboard →')}
    `),
  });

const sendWithdrawalUpdateEmail = (user, amount, status) =>
  sendMail({
    to: user.email,
    subject: `${status === 'completed' ? '✅ Withdrawal Approved' : '❌ Withdrawal Rejected'} — KenyaVest`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:22px;color:${status === 'completed' ? '#4ade80' : '#ef4444'};">
        Withdrawal ${status === 'completed' ? 'Approved ✅' : 'Rejected ❌'}
      </h2>
      <p style="margin:0 0 24px;color:#8b9ab8;font-size:14px;">Hi ${user.name}, here's an update on your withdrawal request.</p>

      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#8b9ab8;text-transform:uppercase;letter-spacing:1px;">Amount</p>
        <p style="margin:0;font-size:36px;font-weight:900;color:#fff;">KES ${Number(amount).toLocaleString()}</p>
        <p style="margin:8px 0 0;font-size:13px;color:${status === 'completed' ? '#4ade80' : '#ef4444'};font-weight:700;">${status === 'completed' ? '✅ Approved & Processed' : '❌ Rejected'}</p>
      </div>

      ${status === 'completed'
        ? '<p style="color:#e8eaf0;font-size:14px;">💸 Funds will be sent to your M-Pesa number within a few minutes.</p>'
        : '<p style="color:#e8eaf0;font-size:14px;">Your balance has been restored. If you believe this is an error, please contact our support team.</p>'
      }

      ${btn(`${APP_URL}/dashboard.html`, 'View Dashboard →')}
    `),
  });

const sendDepositApprovedEmail = (user, amount) =>
  sendMail({
    to: user.email,
    subject: '✅ Deposit Approved — KenyaVest',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#4ade80;">Deposit Approved ✅</h2>
      <p style="margin:0 0 24px;color:#8b9ab8;font-size:14px;">Hi ${user.name}, your deposit has been approved and credited to your balance.</p>

      <div style="background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.15);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#8b9ab8;text-transform:uppercase;letter-spacing:1px;">Credited to your account</p>
        <p style="margin:0;font-size:36px;font-weight:900;color:#4ade80;">KES ${Number(amount).toLocaleString()}</p>
      </div>

      <p style="color:#e8eaf0;font-size:14px;">You can now use these funds to invest in any of our plans and start earning daily returns.</p>

      ${btn(`${APP_URL}/dashboard.html`, '🚀 Start Investing →')}
    `),
  });

const sendReferralBonusEmail = (referrer, amount, referredName) =>
  sendMail({
    to: referrer.email,
    subject: '🎉 You Earned a Referral Bonus! — KenyaVest',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#a855f7;">Referral Bonus Earned! 🎉</h2>
      <p style="margin:0 0 24px;color:#8b9ab8;font-size:14px;">Great news, ${referrer.name}! Your referral just made their first deposit.</p>

      <div style="background:rgba(168,85,247,0.07);border:1px solid rgba(168,85,247,0.2);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#8b9ab8;text-transform:uppercase;letter-spacing:1px;">Referral Bonus</p>
        <p style="margin:0;font-size:36px;font-weight:900;color:#a855f7;">KES ${Number(amount).toLocaleString()}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#8b9ab8;">From <strong style="color:#fff;">${referredName}</strong>'s first deposit</p>
      </div>

      <p style="color:#e8eaf0;font-size:14px;">Keep sharing your referral code to earn more bonuses. Every friend you bring earns you <strong style="color:#F4C430;">10%</strong> of their first deposit!</p>

      ${btn(`${APP_URL}/dashboard.html`, 'View My Earnings →')}
    `),
  });

const sendNewWithdrawalAdminNotification = (adminEmail, user, amount, phone) =>
  sendMail({
    to: adminEmail,
    subject: '⚠️ ACTION REQUIRED: New Withdrawal Request — KenyaVest',
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#f59e0b;">New Withdrawal Request ⚠️</h2>
      <p style="margin:0 0 24px;color:#8b9ab8;font-size:14px;">A user has submitted a withdrawal request that requires your approval.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tr>
          <td style="padding:13px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="color:#8b9ab8;font-size:13px;">User</span>
            <strong style="color:#fff;float:right;font-size:13px;">${user.name}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:13px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="color:#8b9ab8;font-size:13px;">Email</span>
            <strong style="color:#fff;float:right;font-size:13px;">${user.email}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:13px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="color:#8b9ab8;font-size:13px;">Amount</span>
            <strong style="color:#F4C430;float:right;font-size:13px;">KES ${Number(amount).toLocaleString()}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:13px 16px;">
            <span style="color:#8b9ab8;font-size:13px;">M-Pesa Number</span>
            <strong style="color:#4ade80;float:right;font-size:13px;">${phone}</strong>
          </td>
        </tr>
      </table>

      ${btn(`${APP_URL}/admin.html`, 'Go to Admin Panel →')}
    `),
  });

module.exports = {
  sendWelcomeEmail,
  sendOTPEmail,
  sendDepositConfirmation,
  sendROICreditEmail,
  sendWithdrawalUpdateEmail,
  sendDepositApprovedEmail,
  sendReferralBonusEmail,
  sendNewWithdrawalAdminNotification,
};
