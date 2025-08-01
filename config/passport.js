const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// ✅ Only require GoogleStrategy if enabled
if (process.env.DISABLE_GOOGLE_AUTH !== 'true') {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: profile.displayName,
          username: profile.displayName.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 1000),
          email,
          password: '', // Google users don't need a password
          isVerified: true
        });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return done(null, { user, token });
    } catch (err) {
      return done(err, null);
    }
  }));
}

passport.serializeUser((obj, done) => done(null, obj));
passport.deserializeUser((obj, done) => done(null, obj));

