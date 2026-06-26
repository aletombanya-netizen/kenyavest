const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendWelcomeEmail, sendOTPEmail } = require('../services/emailService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Register ──────────────────────────────────────────────────────
// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password, referralCode } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      } else {
        // User exists but is not verified. Resend OTP.
        await OTP.deleteMany({ email, purpose: 'verify' });
        const code = generateOTP();
        await OTP.create({
          email: user.email,
          code,
          purpose: 'verify',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });
        console.log(`[OTP - Reregister] Email: ${email} | Code: ${code} | Purpose: verify`);
        
        // Send OTP email
        const emailSent = await sendOTPEmail(user.email, code, 'verify');

        return res.status(201).json({
          message: emailSent
            ? 'Account created! Please check your email for the verification code.'
            : `Account created! Your verification code is: ${code} (email not configured)`,
          email: user.email,
          requiresVerification: true,
        });
      }
    }

    // Check if phone already exists
    let phoneUser = await User.findOne({ phone });
    if (phoneUser) {
      return res.status(400).json({ message: 'An account with this phone number already exists' });
    }

    // Validate referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    }

    // Create user (isVerified = false until OTP confirmed)
    user = await User.create({
      name,
      phone,
      email,
      password,
      referredBy: referrer ? referrer._id : null,
      isVerified: false,
    });

    // Generate and save OTP
    const code = generateOTP();
    await OTP.create({
      email: user.email,
      code,
      purpose: 'verify',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, code, 'verify');
    console.log(`[OTP] Email: ${email} | Code: ${code} | Purpose: verify`);

    // Send welcome email if they provided an email (optional field)
    if (user.email) sendWelcomeEmail(user).catch(() => {});

    res.status(201).json({
      message: emailSent
        ? 'Account created! Please check your email for the verification code.'
        : `Account created! Your verification code is: ${code}`,
      email: user.email,
      requiresVerification: true,
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ── Verify Email OTP ──────────────────────────────────────────────
// @route POST /api/auth/verify-phone (we keep route for now but it verifies email)
const verifyPhone = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const otp = await OTP.findOne({ email, code, purpose: 'verify', used: false });
    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    otp.used = true;
    await otp.save();

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    // Send welcome email now that they're verified
    if (user.email) sendWelcomeEmail(user).catch(() => {});

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      balance: user.balance,
      role: user.role,
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('[Verify OTP Error]', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// ── Resend OTP ────────────────────────────────────────────────────
// @route POST /api/auth/resend-otp
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });
    if (user.isVerified) return res.status(400).json({ message: 'This account is already verified' });

    // Invalidate old OTPs
    await OTP.deleteMany({ email, purpose: 'verify' });

    const code = generateOTP();
    await OTP.create({
      email,
      code,
      purpose: 'verify',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    
    // Send OTP email
    await sendOTPEmail(user.email, code, 'verify');
    console.log(`[OTP RESEND] Email: ${email} | Code: ${code}`);
    res.json({ message: 'New OTP sent. Check the Render logs for the code.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Login ─────────────────────────────────────────────────────────
// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      // Resend a fresh OTP automatically
      await OTP.deleteMany({ email, purpose: 'verify' });
      const code = generateOTP();
      await OTP.create({ email, code, purpose: 'verify', expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      
      // Send OTP email
      const emailSent = await sendOTPEmail(user.email, code, 'verify');
      console.log(`[OTP - Login Attempt] Email: ${email} | Code: ${code}`);
      
      return res.status(403).json({
        message: emailSent
          ? 'Please check your email for the verification code.'
          : `Your verification code is: ${code}`,
        requiresVerification: true,
        email: user.email,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      balance: user.balance,
      role: user.role,
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ── Forgot Password ───────────────────────────────────────────────
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists
      return res.json({ message: 'If that email is registered, an OTP has been sent.' });
    }

    await OTP.deleteMany({ email, purpose: 'reset' });
    const code = generateOTP();
    await OTP.create({
      email,
      code,
      purpose: 'reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    
    // Send OTP email
    await sendOTPEmail(user.email, code, 'reset');
    console.log(`[OTP - PASSWORD RESET] Email: ${email} | Code: ${code}`);
    res.json({ message: 'OTP sent. Check the Render logs for the code.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Reset Password ────────────────────────────────────────────────
// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const otp = await OTP.findOne({ email, code, purpose: 'reset', used: false });
    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    otp.used = true;
    await otp.save();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get Profile ───────────────────────────────────────────────────
// @route GET /api/auth/profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Calculate VIP Tier dynamically
    let vipTier = 'Bronze';
    const acc = user.accumulatedDeposits || 0;
    if (acc >= 100000) vipTier = 'Platinum';
    else if (acc >= 50000) vipTier = 'Gold';
    else if (acc >= 10000) vipTier = 'Silver';
    
    const userObj = user.toObject();
    userObj.vipTier = vipTier;
    
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get Transactions (for dashboard chart) ────────────────────────
// @route GET /api/auth/transactions
const getUserTransactions = async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const txs = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(txs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get Leaderboard ───────────────────────────────────────────────
// @route GET /api/auth/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const topReferrers = await User.find({ referralEarnings: { $gt: 0 } })
      .select('name referralEarnings')
      .sort({ referralEarnings: -1 })
      .limit(10);
    
    // Anonymize names slightly for privacy (e.g. John Doe -> John D.)
    const formatted = topReferrers.map(user => {
      const nameParts = user.name.trim().split(' ');
      const displayName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.` 
        : user.name;
      return {
        name: displayName,
        earnings: user.referralEarnings
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyPhone,
  resendOTP,
  forgotPassword,
  resetPassword,
  getUserProfile,
  getUserTransactions,
  getLeaderboard,
};
