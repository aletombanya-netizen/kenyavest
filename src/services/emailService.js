const sgMail = require('@sendgrid/mail');

// Configure SendGrid — uses SENDGRID_API_KEY env var
const isConfigured = !!process.env.SENDGRID_API_KEY;
if (isConfigured) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@kenyavest.com';
const FROM_NAME  = 'KenyaVest';

/**
 * Send an email via SendGrid.
 * Returns true if sent successfully, false otherwise.
 */
const sendMail = async ({ to, subject, html }) => {
  if (!isConfigured) {
    console.log(`[EMAIL - SendGrid not configured] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    await sgMail.send({
      to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      html,
    });
    console.log(`[EMAIL - Sent] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (err) {
    console.error('[SendGrid Error]', err.response?.body?.errors || err.message);
    return false;
  }
};

// ── Email Templates ─────────────────────────────────────────────────

const sendWelcomeEmail = (user) =>
  sendMail({
    to: user.email,
    subject: '🎉 Welcome to KenyaVest!',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#F4C430,#D4A017);padding:30px;text-align:center">
          <h1 style="margin:0;color:#0B1120;font-size:28px">KenyaVest</h1>
          <p style="margin:6px 0 0;color:#3d2a00;font-weight:600">Kenya's #1 Investment Platform</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#F4C430;margin-top:0">Welcome, ${user.name}! 🎉</h2>
          <p>Your KenyaVest account has been created successfully. You're now part of thousands of Kenyans growing their wealth daily.</p>
          <p><strong>Your referral code:</strong> <code style="background:#1a2235;padding:4px 10px;border-radius:6px;color:#F4C430;font-size:16px">${user.referralCode}</code></p>
          <p>Share this code with friends and earn <strong>10% of their first deposit</strong> instantly!</p>
          <a href="${process.env.APP_URL || 'https://kenyavest.onrender.com'}/dashboard.html" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#F4C430,#D4A017);color:#000;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">Start Investing →</a>
          <p style="margin-top:24px;color:#8b9ab8;font-size:12px">If you didn't create this account, you can safely ignore this email.</p>
        </div>
      </div>`,
  });

const sendOTPEmail = (email, code, purpose) =>
  sendMail({
    to: email,
    subject: purpose === 'reset'
      ? '🔑 Password Reset Code — KenyaVest'
      : '✉️ Email Verification Code — KenyaVest',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#F4C430,#D4A017);padding:24px;text-align:center">
          <h1 style="margin:0;color:#0B1120;font-size:24px">KenyaVest</h1>
        </div>
        <div style="padding:36px;text-align:center">
          <h2 style="color:#F4C430;margin-top:0">${purpose === 'reset' ? '🔑 Password Reset' : '✉️ Verify Your Email'}</h2>
          <p style="color:#94a3b8;margin-bottom:24px">${purpose === 'reset' ? 'Use the code below to reset your password.' : 'Use the code below to verify your email address.'}</p>
          <div style="font-size:42px;font-weight:800;letter-spacing:14px;color:#fff;background:#0B1120;padding:24px 16px;border-radius:12px;margin:0 auto 24px;border:2px solid rgba(244,196,48,0.3);display:inline-block;min-width:240px">${code}</div>
          <p style="color:#94a3b8;font-size:14px">This code expires in <strong style="color:#fff">10 minutes</strong>. Never share it with anyone.</p>
          <p style="color:#64748b;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>`,
  });

const sendDepositConfirmation = (user, amount) =>
  sendMail({
    to: user.email,
    subject: '✅ M-Pesa Deposit Initiated — KenyaVest',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="padding:30px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <h2 style="color:#F4C430;margin:0">Deposit Initiated 💰</h2>
        </div>
        <div style="padding:32px">
          <p>Hi ${user.name}, your M-Pesa STK push of <strong style="color:#F4C430">KES ${amount.toLocaleString()}</strong> has been initiated.</p>
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
        <div style="padding:30px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <h2 style="color:#F4C430;margin:0">Daily Return Credited 💸</h2>
        </div>
        <div style="padding:32px">
          <p>Great news, ${user.name}! Your daily investment return of <strong style="color:#F4C430">KES ${amount.toLocaleString()}</strong> has been credited to your account.</p>
          <p>Your balance is growing — log in to invest more or withdraw your earnings.</p>
          <a href="${process.env.APP_URL || 'https://kenyavest.onrender.com'}/dashboard.html" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#F4C430,#D4A017);color:#000;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">View Dashboard →</a>
        </div>
      </div>`,
  });

const sendWithdrawalUpdateEmail = (user, amount, status) =>
  sendMail({
    to: user.email,
    subject: `${status === 'completed' ? '✅' : '❌'} Withdrawal ${status === 'completed' ? 'Approved' : 'Rejected'} — KenyaVest`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="padding:30px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <h2 style="color:${status === 'completed' ? '#F4C430' : '#ef4444'};margin:0">
            Withdrawal ${status === 'completed' ? 'Approved ✅' : 'Rejected ❌'}
          </h2>
        </div>
        <div style="padding:32px">
          <p>Hi ${user.name}, your withdrawal request of <strong>KES ${amount.toLocaleString()}</strong> has been <strong>${status === 'completed' ? 'approved and processed' : 'rejected by our team'}</strong>.</p>
          ${status === 'completed'
            ? '<p>The funds will be sent to your M-Pesa number within a few minutes.</p>'
            : '<p>Your balance has been restored. If you believe this is a mistake, please contact support.</p>'}
          <a href="${process.env.APP_URL || 'https://kenyavest.onrender.com'}/dashboard.html" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#F4C430,#D4A017);color:#000;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">View Dashboard →</a>
        </div>
      </div>`,
  });

const sendDepositApprovedEmail = (user, amount) =>
  sendMail({
    to: user.email,
    subject: '✅ Deposit Approved and Credited — KenyaVest',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="padding:30px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <h2 style="color:#4ade80;margin:0">Deposit Approved ✅</h2>
        </div>
        <div style="padding:32px">
          <p>Hi ${user.name}, your deposit of <strong style="color:#F4C430">KES ${amount.toLocaleString()}</strong> has been approved and credited to your balance.</p>
          <p>You can now use these funds to invest in our plans.</p>
          <a href="${process.env.APP_URL || 'https://kenyavest.onrender.com'}/dashboard.html" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#F4C430,#D4A017);color:#000;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">View Dashboard →</a>
        </div>
      </div>`,
  });

const sendReferralBonusEmail = (referrer, amount, referredName) =>
  sendMail({
    to: referrer.email,
    subject: '🎉 Referral Bonus Earned! — KenyaVest',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="padding:30px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <h2 style="color:#a855f7;margin:0">Referral Bonus Earned! 🎉</h2>
        </div>
        <div style="padding:32px">
          <p>Great news, ${referrer.name}!</p>
          <p>Your friend <strong>${referredName}</strong> just made their first deposit.</p>
          <p>You have been credited with a referral bonus of <strong style="color:#F4C430">KES ${amount.toLocaleString()}</strong>.</p>
          <p>Keep sharing your referral link to earn more!</p>
          <a href="${process.env.APP_URL || 'https://kenyavest.onrender.com'}/dashboard.html" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#F4C430,#D4A017);color:#000;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">View Dashboard →</a>
        </div>
      </div>`,
  });

const sendNewWithdrawalAdminNotification = (adminEmail, user, amount, phone) =>
  sendMail({
    to: adminEmail,
    subject: '⚠️ ACTION REQUIRED: New Withdrawal Request — KenyaVest',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#111622;color:#e8eaf0;border-radius:16px;overflow:hidden">
        <div style="padding:30px;border-bottom:1px solid rgba(255,255,255,0.08)">
          <h2 style="color:#F4C430;margin:0">New Withdrawal Request 📤</h2>
        </div>
        <div style="padding:32px">
          <p>Hello Admin,</p>
          <p>User <strong>${user.name}</strong> (${user.email}) has requested a withdrawal.</p>
          <ul style="color:#e8eaf0;background:rgba(255,255,255,0.05);padding:16px;border-radius:8px">
            <li><strong>Amount:</strong> KES ${amount.toLocaleString()}</li>
            <li><strong>M-Pesa Number:</strong> ${phone}</li>
          </ul>
          <p>Please log in to the admin panel to review and approve/reject this request.</p>
          <a href="${process.env.APP_URL || 'https://kenyavest.onrender.com'}/admin.html" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#F4C430,#D4A017);color:#000;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none">Go to Admin Panel →</a>
        </div>
      </div>`,
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
