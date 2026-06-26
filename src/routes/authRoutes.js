const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyPhone,
  resendOTP,
  forgotPassword,
  resetPassword,
  getUserProfile,
  getUserTransactions,
  getLeaderboard,
  setupAdmin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, registerValidators, loginValidators } = require('../middleware/validate');

// ── Auth Routes ───────────────────────────────────────────────────
router.post('/register',        registerValidators, validate, registerUser);
router.post('/login',           loginValidators,    validate, loginUser);
router.post('/verify-phone',    verifyPhone);
router.post('/resend-otp',      resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get('/setup-admin',      setupAdmin);

// Private
router.get('/profile',      protect, getUserProfile);
router.get('/transactions', protect, getUserTransactions);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
