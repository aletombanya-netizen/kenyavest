const rateLimit = require('express-rate-limit');

// General API limiter — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Strict limiter for auth routes — 10 attempts per 15 minutes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login/register attempts from this IP, please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count failed requests
});

module.exports = { apiLimiter, authLimiter };
