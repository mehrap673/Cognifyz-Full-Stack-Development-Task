require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const User = require('./models/User');
const { protect, authorize, optionalAuth } = require('./middleware/auth');
const { sendTokenResponse } = require('./utils/jwt');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword, phone, age, gender, country, bio, skills, newsletter, terms } = req.body;
    
    // Validation
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
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Create user
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
    
    // Send token response
    sendTokenResponse(user, 201, res);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Send token response
    sendTokenResponse(user, 200, res);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// Logout user
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

// Get current logged in user
app.get('/api/auth/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: user
  });
});

// Update password
app.put('/api/auth/updatepassword', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = req.body.newPassword;
    await user.save();
    
    sendTokenResponse(user, 200, res);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
});

// ============================================
// SECURED API ENDPOINTS (CRUD)
// ============================================

// Get all users (Protected - Admin only)
app.get('/api/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find();
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get single user (Protected)
app.get('/api/users/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Users can only view their own profile, admins can view all
    if (req.user.id !== user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this profile'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Update user (Protected - Own profile or Admin)
app.put('/api/users/:id', protect, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check authorization
    if (req.user.id !== user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }
    
    // Don't allow updating certain fields
    delete req.body.password;
    delete req.body.role;
    delete req.body._id;
    
    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user (Protected - Admin only)
app.delete('/api/users/:id', protect, authorize('admin'), async (req, res) => {
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
      message: 'User deleted successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Get statistics (Protected - Admin only)
app.get('/api/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const subscribedUsers = await User.countDocuments({ newsletter: true });
    
    const usersByCountry = await User.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } }
    ]);
    
    const usersByGender = await User.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);
    
    const avgAgeResult = await User.aggregate([
      { $group: { _id: null, avgAge: { $avg: '$age' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        subscribedUsers,
        averageAge: avgAgeResult[0] ? Math.round(avgAgeResult[0].avgAge) : 0,
        byCountry: usersByCountry.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byGender: usersByGender.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Search users (Protected)
app.get('/api/users/search/:query', protect, async (req, res) => {
  try {
    const query = req.params.query;
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { country: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
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

app.get('/register-advanced', (req, res) => {
  res.render('register-advanced', { 
    title: 'Advanced Registration'
  });
});

app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login'
  });
});

app.get('/api-dashboard', protect, authorize('admin'), (req, res) => {
  res.render('api-dashboard', {
    title: 'API Dashboard',
    user: req.user
  });
});

app.get('/dashboard', protect, async (req, res) => {
  res.render('user-dashboard', {
    title: 'My Dashboard',
    user: req.user
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 Landing: http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login`);
  console.log(`📝 Register: http://localhost:${PORT}/register-advanced`);
  console.log(`🔌 API Dashboard: http://localhost:${PORT}/api-dashboard (Admin only)`);
});
