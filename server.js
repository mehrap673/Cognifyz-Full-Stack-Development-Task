require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const path = require('path');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const redisClient = require('./config/redis');
const passport = require('./config/passport');
const User = require('./models/User');
const { protect, authorize, optionalAuth } = require('./middleware/auth');
const { sendTokenResponse } = require('./utils/jwt');
const { apiLimiter, authLimiter, externalApiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { cacheMiddleware, clearCache } = require('./middleware/cache');
const ExternalApiService = require('./services/externalApi');
const { sendEmail } = require('./jobs/emailQueue');
const { scheduleAnalytics, scheduleCleanup } = require('./jobs/dataProcessingQueue');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Schedule background jobs
scheduleAnalytics();
scheduleCleanup();

// Compression middleware
app.use(compression());

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://accounts.google.com",
          "https://apis.google.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "http:"
        ],
        connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://api.openweathermap.org",
          "https://newsapi.org",
          "https://v6.exchangerate-api.com",
          "https://api.exchangerate-api.com",
          "https://api.github.com",
          "https://randomuser.me",
          "https://api.quotable.io"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net",
          "data:"
        ],
        frameSrc: [
          "'self'",
          "https://accounts.google.com"
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(cors());

// Request logging
app.use(requestLogger);

// Body Parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Session for OAuth
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword, phone, age, gender, country, bio, skills, newsletter, terms } = req.body;
    
    if (!terms) {
      return res.status(400).json({
        success: false,
        message: 'You must accept terms and conditions'
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    const user = await User.create({
      username,
      email,
      password,
      phone,
      age,
      gender,
      country,
      bio,
      skills: Array.isArray(skills) ? skills : [],
      newsletter: newsletter || false
    });
    
    // Send welcome email (background job)
    await sendEmail({
      to: user.email,
      subject: 'Welcome to ModernApp!',
      body: `Hi ${user.username}, welcome to our platform!`,
      type: 'welcome'
    });
    
    logger.info(`New user registered: ${user.username}`);
    sendTokenResponse(user, 201, res);
    
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    user.lastLogin = Date.now();
    await user.save();
    
    logger.info(`User logged in: ${user.username}`);
    sendTokenResponse(user, 200, res);
    
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
});

// ============================================
// OAUTH ROUTES (Google)
// ============================================

app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: false 
  }),
  async (req, res) => {
    try {
      const { generateToken } = require('./utils/jwt');
      const token = generateToken(req.user._id);
      
      res.cookie('token', token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      });
      
      logger.info(`Google OAuth login: ${req.user.email}`);
      
      const redirectUrl = req.user.role === 'admin' ? '/api-dashboard' : '/external-apis';
      res.redirect(`${redirectUrl}?token=${token}`);
      
    } catch (error) {
      logger.error('Google callback error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);

app.post('/api/auth/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true
  });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.get('/api/auth/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: user
  });
});

// ============================================
// EXTERNAL API ROUTES (with caching)
// ============================================

// Weather API (10 min cache)
app.get('/api/external/weather/:city', protect, cacheMiddleware(600), externalApiLimiter, async (req, res, next) => {
  try {
    const weather = await ExternalApiService.getWeather(req.params.city);
    
    req.user.apiCallsCount += 1;
    req.user.lastApiCall = Date.now();
    await req.user.save();
    
    res.json({
      success: true,
      data: weather
    });
  } catch (error) {
    next(error);
  }
});

// News API (5 min cache)
app.get('/api/external/news', protect, cacheMiddleware(300), externalApiLimiter, async (req, res, next) => {
  try {
    const { country = 'us', category = 'technology' } = req.query;
    const news = await ExternalApiService.getNews(country, category);
    
    req.user.apiCallsCount += 1;
    req.user.lastApiCall = Date.now();
    await req.user.save();
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    logger.error('News route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch news'
    });
  }
});

// Exchange Rates API (1 hour cache)
app.get('/api/external/exchange/:base?', protect, cacheMiddleware(3600), externalApiLimiter, async (req, res, next) => {
  try {
    const base = req.params.base || 'USD';
    const rates = await ExternalApiService.getExchangeRates(base);
    
    req.user.apiCallsCount += 1;
    req.user.lastApiCall = Date.now();
    await req.user.save();
    
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    next(error);
  }
});

// Random User API
app.get('/api/external/randomuser', protect, externalApiLimiter, async (req, res, next) => {
  try {
    const user = await ExternalApiService.getRandomUser();
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Random Quote API
app.get('/api/external/quote', protect, externalApiLimiter, async (req, res, next) => {
  try {
    const quote = await ExternalApiService.getRandomQuote();
    
    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    next(error);
  }
});

// GitHub User API (30 min cache)
app.get('/api/external/github/:username', protect, cacheMiddleware(1800), externalApiLimiter, async (req, res, next) => {
  try {
    const githubUser = await ExternalApiService.getGitHubUser(req.params.username);
    
    req.user.apiCallsCount += 1;
    req.user.lastApiCall = Date.now();
    await req.user.save();
    
    res.json({
      success: true,
      data: githubUser
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// CRUD ROUTES
// ============================================

app.get('/api/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find();
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/users/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (req.user.id !== user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/users/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.deleteOne();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Clear cache endpoint (admin only)
app.delete('/api/admin/cache/:pattern?', protect, authorize('admin'), async (req, res) => {
  try {
    const pattern = req.params.pattern || '*';
    const count = await clearCache(pattern);
    
    logger.info(`Admin cleared ${count} cache entries`);
    res.json({
      success: true,
      message: `Cleared ${count} cache entries`,
      pattern
    });
  } catch (error) {
    logger.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

// View logs endpoint (admin only)
app.get('/api/admin/logs', protect, authorize('admin'), (req, res) => {
  const fs = require('fs');
  const logsDir = path.join(__dirname, 'logs');
  
  try {
    if (!fs.existsSync(logsDir)) {
      return res.json({
        success: true,
        logs: [],
        message: 'No logs directory found'
      });
    }

    const files = fs.readdirSync(logsDir);
    res.json({
      success: true,
      logs: files
    });
  } catch (error) {
    logger.error('Log reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to read logs'
    });
  }
});

// ============================================
// VIEW ROUTES
// ============================================

app.get('/', optionalAuth, (req, res) => {
  res.render('landing', { 
    title: 'ModernApp',
    user: req.user || null
  });
});

app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login',
    user: null
  });
});

app.get('/register-advanced', (req, res) => {
  res.render('register-advanced', { 
    title: 'Register',
    user: null
  });
});

app.get('/api-dashboard', protect, authorize('admin'), (req, res) => {
  res.render('api-dashboard', {
    title: 'API Dashboard',
    user: req.user
  });
});

app.get('/dashboard', protect, (req, res) => {
  res.render('user-dashboard', {
    title: 'Dashboard',
    user: req.user
  });
});

app.get('/external-apis', protect, (req, res) => {
  res.render('external-apis', {
    title: 'External APIs',
    user: req.user
  });
});

app.get('/all-users', optionalAuth, async (req, res) => {
  try {
    const users = await User.find();
    res.render('all-users', {
      title: 'All Users',
      users: users,
      user: req.user || null
    });
  } catch (error) {
    logger.error('All users error:', error);
    res.status(500).send('Error fetching users');
  }
});

// ============================================
// ERROR HANDLER (must be last)
// ============================================

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login`);
  console.log(`📝 Register: http://localhost:${PORT}/register-advanced`);
  console.log(`🌍 External APIs: http://localhost:${PORT}/external-apis`);
  console.log(`\n📦 Advanced Features Enabled:`);
  console.log(`   ✅ Redis Caching`);
  console.log(`   ✅ Winston Logging (logs/ folder)`);
  console.log(`   ✅ Request Logging (Morgan)`);
  console.log(`   ✅ Background Jobs (Bull Queue)`);
  console.log(`   ✅ Email Queue`);
  console.log(`   ✅ Data Processing Queue`);
  console.log(`   ✅ Compression`);
});
