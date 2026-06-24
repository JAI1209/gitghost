require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repos');
const reviewRoutes = require('./routes/reviews');
const webhookRoutes = require('./routes/webhooks');
const dashboardRoutes = require('./routes/dashboard');

const dns = require('node:dns');

// Force Node to use Cloudflare and Google DNS
dns.setServers(['1.1.1.1', '8.8.8.8']);

require('./config/passport');
require('./workers/scanWorker');
require('./workers/reviewWorker');

const app = express();

/**
 * IMPORTANT FOR RENDER + SECURE COOKIES
 */
app.set('trust proxy', 1);

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());

// Webhooks need raw body BEFORE express.json()
app.use('/webhooks', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite:
        process.env.NODE_ENV === 'production'
          ? 'none'
          : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 GitGhost backend running on port ${PORT}`);
});