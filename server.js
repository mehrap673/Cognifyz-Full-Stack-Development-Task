const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { validateRegistrationForm } = require('./validators');

const app = express();
const PORT = 3000;

// Temporary in-memory storage
let registeredUsers = [];
let idCounter = 1;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================
// TASK 5: RESTful API ENDPOINTS
// ============================================

// API: Get all users
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    count: registeredUsers.length,
    data: registeredUsers
  });
});

// API: Get single user by ID
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = registeredUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// API: Create new user
app.post('/api/users', (req, res) => {
  const formData = req.body;
  
  // Server-side validation
  const errors = validateRegistrationForm(formData);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }
  
  // Check for duplicate
  const duplicate = registeredUsers.find(
    u => u.username === formData.username || u.email === formData.email
  );
  
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: 'Username or email already exists'
    });
  }
  
  // Create new user
  const user = {
    id: idCounter++,
    username: formData.username,
    email: formData.email,
    phone: formData.phone,
    age: parseInt(formData.age),
    gender: formData.gender,
    country: formData.country,
    postalCode: formData.postalCode || 'N/A',
    website: formData.website || 'N/A',
    bio: formData.bio || 'No bio provided',
    skills: Array.isArray(formData.skills) ? formData.skills : [],
    newsletter: formData.newsletter || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  registeredUsers.push(user);
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
});

// API: Update user by ID
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = registeredUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const updatedData = req.body;
  const currentUser = registeredUsers[userIndex];
  
  // Update user
  registeredUsers[userIndex] = {
    ...currentUser,
    ...updatedData,
    id: userId, // Keep original ID
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: registeredUsers[userIndex]
  });
});

// API: Partially update user
app.patch('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = registeredUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Merge updates
  registeredUsers[userIndex] = {
    ...registeredUsers[userIndex],
    ...req.body,
    id: userId,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: registeredUsers[userIndex]
  });
});

// API: Delete user by ID
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = registeredUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const deletedUser = registeredUsers.splice(userIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'User deleted successfully',
    data: deletedUser
  });
});

// API: Search users
app.get('/api/users/search/:query', (req, res) => {
  const query = req.params.query.toLowerCase();
  
  const results = registeredUsers.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    user.country.toLowerCase().includes(query)
  );
  
  res.json({
    success: true,
    count: results.length,
    data: results
  });
});

// API: Filter users by country
app.get('/api/users/filter/country/:country', (req, res) => {
  const country = req.params.country;
  
  const results = registeredUsers.filter(user => 
    user.country === country
  );
  
  res.json({
    success: true,
    count: results.length,
    data: results
  });
});

// API: Get statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    totalUsers: registeredUsers.length,
    byCountry: {},
    byGender: {},
    averageAge: 0,
    newsletterSubscribers: 0
  };
  
  registeredUsers.forEach(user => {
    // Count by country
    stats.byCountry[user.country] = (stats.byCountry[user.country] || 0) + 1;
    
    // Count by gender
    stats.byGender[user.gender] = (stats.byGender[user.gender] || 0) + 1;
    
    // Sum ages
    stats.averageAge += user.age;
    
    // Count newsletter subscribers
    if (user.newsletter) stats.newsletterSubscribers++;
  });
  
  if (registeredUsers.length > 0) {
    stats.averageAge = Math.round(stats.averageAge / registeredUsers.length);
  }
  
  res.json({
    success: true,
    data: stats
  });
});

// ============================================
// TRADITIONAL ROUTES (Keep existing ones)
// ============================================

app.get('/', (req, res) => {
  res.render('landing', { 
    title: 'ModernApp'
  });
});

app.get('/landing', (req, res) => {
  res.render('landing', { 
    title: 'ModernApp - Advanced Design'
  });
});

app.get('/register-advanced', (req, res) => {
  res.render('register-advanced', { 
    title: 'Advanced Registration'
  });
});

// NEW: API Dashboard View
app.get('/api-dashboard', (req, res) => {
  res.render('api-dashboard', {
    title: 'API Dashboard'
  });
});

app.post('/register', (req, res) => {
  const formData = req.body;
  
  const errors = validateRegistrationForm(formData);

  if (errors.length > 0) {
    return res.render('validation-errors', {
      title: 'Validation Errors',
      errors,
      formData
    });
  }

  const duplicate = registeredUsers.find(
    u => u.username === formData.username || u.email === formData.email
  );

  if (duplicate) {
    return res.render('validation-errors', {
      title: 'Registration Failed',
      errors: ['Username or email already exists'],
      formData
    });
  }

  const user = {
    id: idCounter++,
    username: formData.username,
    email: formData.email,
    phone: formData.phone,
    age: parseInt(formData.age),
    gender: formData.gender,
    country: formData.country,
    postalCode: formData.postalCode || 'N/A',
    creditCard: formData.creditCard ? '****' + formData.creditCard.slice(-4) : 'N/A',
    website: formData.website || 'N/A',
    bio: formData.bio || 'No bio provided',
    skills: Array.isArray(formData['skill[]']) ? formData['skill[]'].filter(s => s) : [],
    newsletter: formData.newsletter === 'on',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  registeredUsers.push(user);

  res.redirect(`/dashboard?userId=${user.id}`);
});

app.get('/dashboard', (req, res) => {
  const userId = parseInt(req.query.userId);
  const user = registeredUsers.find(u => u.id === userId);

  if (!user) {
    return res.redirect('/');
  }

  res.render('dashboard', {
    title: 'User Dashboard',
    user,
    totalUsers: registeredUsers.length
  });
});

app.get('/all-users', (req, res) => {
  res.render('all-users', {
    title: 'All Registered Users',
    users: registeredUsers
  });
});

app.post('/check-username', (req, res) => {
  const { username } = req.body;
  const exists = registeredUsers.some(u => u.username === username);
  res.json({ available: !exists });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 Landing: http://localhost:${PORT}`);
  console.log(`📝 Register: http://localhost:${PORT}/register-advanced`);
  console.log(`🔌 API Dashboard: http://localhost:${PORT}/api-dashboard`);
  console.log(`🔌 API Endpoint: http://localhost:${PORT}/api/users`);
});
