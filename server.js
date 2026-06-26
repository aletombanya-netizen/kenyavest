const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const investmentRoutes = require('./src/routes/investmentRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const { startDailyROICron } = require('./src/services/cronJobs');
const { apiLimiter, authLimiter } = require('./src/middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Start cron jobs
startDailyROICron();

// ── Security Headers (Helmet) ─────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https://kashflowvest.onrender.com', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
        workerSrc: ["'self'", 'blob:'],
        manifestSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ──────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://kashflowvest.onrender.com',
  'http://localhost:3000',
  'http://localhost:5000',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ── Request Logging ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Body Parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent large payload attacks
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── API Routes (with rate limiting) ──────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);     // Strict limit on auth
app.use('/api/payments', apiLimiter, paymentRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/investments', apiLimiter, investmentRoutes);
app.use('/api/contact', apiLimiter, contactRoutes);
app.use('/api/public', apiLimiter, publicRoutes);

// ── Static Files ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Smart Catch-all (404 for unknown routes, SPA fallback for known) ─
const spaRoutes = ['/', '/index.html', '/login.html', '/register.html', '/dashboard.html', '/admin.html', '/verify.html', '/terms.html', '/privacy.html', '/404.html', '/transactions.html', '/profile.html'];
app.use((req, res) => {
  // API misses handled separately
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  // Known SPA pages
  if (spaRoutes.includes(req.path)) {
    return res.sendFile(path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path.slice(1)));
  }
  // Everything else → 404 page
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
