const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🔐 JWT Generator
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// 🔐 Register
exports.registerUser = async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'User already exists' });

    if (await User.findOne({ username }))
      return res.status(400).json({ message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false
    });

    const verifyUrl = `https://modenova.co.ke/verify.html?token=${verificationToken}&email=${email}`;
    await sendEmail(
      email,
      '🔐 Verify Your Fashion Fit Email',
      `Click the link below to verify your email:\n${verifyUrl}`
    );

    console.log(`✅ Verification email sent to ${email}`);
    res.status(201).json({ message: '✅ Registered! Please check your email to verify your account.' });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔐 Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified)
      return res.status(403).json({ message: 'Please verify your email before logging in.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔐 Google Auth
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });

    // 👉 New user (first time with Google)
    if (!user) {
      const verificationToken = crypto.randomBytes(32).toString('hex');

      user = await User.create({
        name,
        email,
        username: email.split('@')[0],
        password: crypto.randomBytes(16).toString('hex'), // random dummy password
        isVerified: false,
        verificationToken
      });

      const verifyUrl = `https://modenova.co.ke/verify.html?token=${verificationToken}&email=${email}`;
      await sendEmail(
        email,
        '🔐 Verify Your Fashion Fit Email',
        `Please verify your email by clicking:\n${verifyUrl}`
      );

      return res.status(403).json({ message: '⚠️ Verification email sent. Please check your inbox.' });
    }

    // 👉 Existing user but not verified
    if (!user.isVerified) {
      if (!user.verificationToken) {
        user.verificationToken = crypto.randomBytes(32).toString('hex');
        await user.save();
      }

      const verifyUrl = `https://modenova.co.ke/verify.html?token=${user.verificationToken}&email=${email}`;
      await sendEmail(
        email,
        '🔐 Verify Your Fashion Fit Email',
        `Please verify your email by clicking:\n${verifyUrl}`
      );

      return res.status(403).json({ message: '⚠️ Verification email resent. Please check your inbox.' });
    }

    // ✅ Verified user
    const jwtToken = generateToken(user._id);
    res.json({ token: jwtToken });

  } catch (err) {
    console.error('Google login error:', err);
    res.status(400).json({ message: 'Google login failed.' });
  }
};


