const rateLimit = require('express-rate-limit');

// Whitelist localhost IPs to bypass rate limiting during development
const LOCALHOST_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const skipLocalhost = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || '';
  return LOCALHOST_IPS.has(ip);
};

// General API limiter — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalhost, // Bypass for localhost
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
  skip: skipLocalhost, // Bypass for localhost
  message: {
    message: 'Too many login/register attempts from this IP, please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count failed requests
});

module.exports = { apiLimiter, authLimiter };

