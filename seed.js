require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedUsers = [
  {
    username: 'admin',
    email: 'admin@test.com',
    password: 'Admin@123',
    phone: '9876543210',
    age: 30,
    gender: 'male',
    country: 'India',
    bio: 'System Administrator',
    role: 'admin',
    newsletter: true
  },
  {
    username: 'testuser',
    email: 'user@test.com',
    password: 'User@123',
    phone: '8765432109',
    age: 25,
    gender: 'female',
    country: 'USA',
    bio: 'Regular user',
    role: 'user',
    newsletter: false
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    
    await User.deleteMany({});
    console.log('Cleared existing users');
    
    await User.create(seedUsers);
    console.log('✅ Demo users created successfully!');
    console.log('Admin: admin@test.com / Admin@123');
    console.log('User: user@test.com / User@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedDB();
