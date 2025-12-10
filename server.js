const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { validateRegistrationForm } = require('./validators');

const app = express();
const PORT = 3000;

// Temporary in-memory storage
let registeredUsers = [];

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// TASK 3 ROUTES

// Home - Landing Page with Bootstrap
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

// Bootstrap Registration Form
app.get('/register-advanced', (req, res) => {
  res.render('register-advanced', { 
    title: 'Advanced Registration'
  });
});

// Handle Registration Form Submission
app.post('/register', (req, res) => {
  const formData = req.body;
  
  // Server-side validation
  const errors = validateRegistrationForm(formData);

  if (errors.length > 0) {
    return res.render('validation-errors', {
      title: 'Validation Errors',
      errors,
      formData
    });
  }

  // Check for duplicate username/email
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

  // Store validated data
  const user = {
    id: registeredUsers.length + 1,
    username: formData.username,
    email: formData.email,
    phone: formData.phone,
    age: parseInt(formData.age),
    gender: formData.gender,
    country: formData.country,
    website: formData.website || 'N/A',
    bio: formData.bio || 'No bio provided',
    newsletter: formData.newsletter === 'on',
    registeredAt: new Date().toLocaleString('en-IN')
  };

  registeredUsers.push(user);

  res.redirect(`/dashboard?userId=${user.id}`);
});

// User Dashboard
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

// All Users List
app.get('/all-users', (req, res) => {
  res.render('all-users', {
    title: 'All Registered Users',
    users: registeredUsers
  });
});

// Delete User API
app.delete('/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  registeredUsers = registeredUsers.filter(u => u.id !== userId);
  res.json({ success: true });
});

// Check Username Availability API
app.post('/check-username', (req, res) => {
  const { username } = req.body;
  const exists = registeredUsers.some(u => u.username === username);
  res.json({ available: !exists });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 Landing Page: http://localhost:${PORT}`);
  console.log(`📝 Register: http://localhost:${PORT}/register-advanced`);
  console.log(`👥 Users: http://localhost:${PORT}/all-users`);
});
