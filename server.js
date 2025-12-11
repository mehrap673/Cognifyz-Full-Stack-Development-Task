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
const path = require('path');

const connectDB = require('./config/database');
const passport = require('./config/passport');
const User = require('./models/User');
const { protect, authorize, optionalAuth } = require('./middleware/auth');
const { sendTokenResponse } = require('./utils/jwt');
const { apiLimiter, authLimiter, externalApiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const ExternalApiService = require('./services/externalApi');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Security Middleware - FIX HELMET CSP HERE
// Security Middleware - FIX HELMET CSP HERE
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
          "https://cdn.jsdelivr.net",  // ADD THIS LINE
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
// AUTHENTICATION ROUTES (with rate limiting)
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
    
    sendTokenResponse(user, 201, res);
    
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  console.log('🔐 Login attempt:', req.body.email); // DEBUG
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', !!user); // DEBUG
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const isMatch = await user.comparePassword(password);
    console.log('🔑 Password match:', isMatch); // DEBUG
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    user.lastLogin = Date.now();
    await user.save();
    
    console.log('✅ Login successful'); // DEBUG
    sendTokenResponse(user, 200, res);
    
  } catch (error) {
    console.error('❌ Login error:', error); // DEBUG
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
      console.log('🔐 Google callback for:', req.user.email);
      
      // Generate JWT token
      const { generateToken } = require('./utils/jwt');
      const token = generateToken(req.user._id);
      
      // Set cookie
      res.cookie('token', token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      });
      
      console.log('✅ Google login successful, redirecting...');
      
      // Redirect with token in URL as fallback
      const redirectUrl = req.user.role === 'admin' ? '/api-dashboard' : '/external-apis';
      res.redirect(`${redirectUrl}?token=${token}`);
      
    } catch (error) {
      console.error('❌ Google callback error:', error);
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
// EXTERNAL API ROUTES (with rate limiting)
// ============================================

// Weather API
app.get('/api/external/weather/:city', protect, externalApiLimiter, async (req, res, next) => {
  try {
    const weather = await ExternalApiService.getWeather(req.params.city);
    
    // Track API usage
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

// News API
// News API - FIX country parameter
app.get('/api/external/news', protect, externalApiLimiter, async (req, res, next) => {
  try {
    const { country = 'us', category = 'technology' } = req.query;  // Changed default from 'in' to 'us'
    const news = await ExternalApiService.getNews(country, category);
    
    req.user.apiCallsCount += 1;
    req.user.lastApiCall = Date.now();
    await req.user.save();
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('News route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch news'
    });
  }
});


// Exchange Rates API
app.get('/api/external/exchange/:base?', protect, externalApiLimiter, async (req, res, next) => {
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

// GitHub User API
app.get('/api/external/github/:username', protect, externalApiLimiter, async (req, res, next) => {
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
// CRUD ROUTES (Keep existing ones)
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
    user: null  // ADD THIS
  });
});

app.get('/register-advanced', (req, res) => {
  res.render('register-advanced', { 
    title: 'Register',
    user: null  // ADD THIS
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

// Add this route if you have all-users page
app.get('/all-users', optionalAuth, async (req, res) => {
  try {
    const users = await User.find();
    res.render('all-users', {
      title: 'All Users',
      users: users,
      user: req.user || null
    });
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
});


// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login`);
  console.log(`📝 Register: http://localhost:${PORT}/register-advanced`);
  console.log(`🌍 External APIs: http://localhost:${PORT}/external-apis`);
});
