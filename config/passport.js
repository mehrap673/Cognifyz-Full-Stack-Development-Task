const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google Profile:', profile.id, profile.emails[0].value);
        
        // Check if user exists with Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          user.lastLogin = Date.now();
          await user.save();
          console.log('Existing Google user found');
          return done(null, user);
        }

        // Check if email exists
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account
          user.googleId = profile.id;
          user.avatar = profile.photos[0]?.value;
          user.lastLogin = Date.now();
          await user.save();
          console.log('Linked Google to existing user');
          return done(null, user);
        }

        // Create new user - FIX USERNAME AND PHONE
        const emailPrefix = profile.emails[0].value.split('@')[0];
        const randomSuffix = Math.random().toString(36).substring(2, 6); // 4 chars
        const username = (emailPrefix.substring(0, 15) + randomSuffix).toLowerCase(); // Max 19 chars
        
        user = await User.create({
          googleId: profile.id,
          username: username,
          email: profile.emails[0].value,
          password: Math.random().toString(36).slice(-8) + 'Aa@1',
          phone: '9999999999', // Valid Indian phone format
          age: 25,
          gender: 'other',
          country: 'India',
          avatar: profile.photos[0]?.value,
          bio: 'Logged in via Google',
          isActive: true,
          lastLogin: Date.now()
        });

        console.log('New Google user created:', username);
        done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
