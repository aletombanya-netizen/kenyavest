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
    const { name, phone, password, referralCode } = req.body;

    let user = await User.findOne({ phone });
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ message: 'An account with this phone number already exists' });
      } else {
        // User exists but is not verified. Resend OTP.
        await OTP.deleteMany({ phone, purpose: 'verify' });
        const code = generateOTP();
        await OTP.create({
          phone: user.phone,
          code,
          purpose: 'verify',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });
        console.log(`[OTP - Reregister] Phone: ${phone} | Code: ${code} | Purpose: verify`);
        return res.status(201).json({
          message: 'Account created! Please verify your phone number.',
          phone: user.phone,
          requiresVerification: true,
        });
      }
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
      password,
      referredBy: referrer ? referrer._id : null,
      isVerified: false,
    });

    // Generate and save OTP
    const code = generateOTP();
    await OTP.create({
      phone: user.phone,
      code,
      purpose: 'verify',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Log OTP to console (no SMS service configured)
    console.log(`[OTP] Phone: ${phone} | Code: ${code} | Purpose: verify`);

    // Send welcome email if they provided an email (optional field)
    if (user.email) sendWelcomeEmail(user).catch(() => {});

    res.status(201).json({
      message: 'Account created! Please verify your phone number.',
      phone: user.phone,
      requiresVerification: true,
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ── Verify Phone OTP ──────────────────────────────────────────────
// @route POST /api/auth/verify-phone
const verifyPhone = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone and OTP code are required' });
    }

    const otp = await OTP.findOne({ phone, code, purpose: 'verify', used: false });
    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    otp.used = true;
    await otp.save();

    const user = await User.findOneAndUpdate(
      { phone },
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
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'No account found with this phone number' });
    if (user.isVerified) return res.status(400).json({ message: 'This account is already verified' });

    // Invalidate old OTPs
    await OTP.deleteMany({ phone, purpose: 'verify' });

    const code = generateOTP();
    await OTP.create({
      phone,
      code,
      purpose: 'verify',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    console.log(`[OTP RESEND] Phone: ${phone} | Code: ${code}`);
    res.json({ message: 'New OTP sent. Check the Render logs for the code.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Login ─────────────────────────────────────────────────────────
// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    if (!user.isVerified) {
      // Resend a fresh OTP automatically
      await OTP.deleteMany({ phone, purpose: 'verify' });
      const code = generateOTP();
      await OTP.create({ phone, code, purpose: 'verify', expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      console.log(`[OTP - Login Attempt] Phone: ${phone} | Code: ${code}`);
      return res.status(403).json({
        message: 'Please verify your phone number first.',
        requiresVerification: true,
        phone: user.phone,
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
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      // Don't reveal whether phone exists
      return res.json({ message: 'If that number is registered, an OTP has been sent.' });
    }

    await OTP.deleteMany({ phone, purpose: 'reset' });
    const code = generateOTP();
    await OTP.create({
      phone,
      code,
      purpose: 'reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    console.log(`[OTP - PASSWORD RESET] Phone: ${phone} | Code: ${code}`);
    res.json({ message: 'OTP sent. Check the Render logs for the code.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Reset Password ────────────────────────────────────────────────
// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    if (!phone || !code || !newPassword) {
      return res.status(400).json({ message: 'Phone, OTP code, and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const otp = await OTP.findOne({ phone, code, purpose: 'reset', used: false });
    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    otp.used = true;
    await otp.save();

    const user = await User.findOne({ phone });
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
    res.json(user);
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

module.exports = {
  registerUser,
  loginUser,
  verifyPhone,
  resendOTP,
  forgotPassword,
  resetPassword,
  getUserProfile,
  getUserTransactions,
};
