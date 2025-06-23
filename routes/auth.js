const express = require('express');
const sendEmail = require('../utils/sendEmail');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const authLimiter = require('../middleware/rateLimiter');
const crypto = require('crypto');

// 🔐 Register (with rate limiting)
router.post('/register', authLimiter, registerUser);

// 🔐 Login
router.post('/login', loginUser);

// 💌 Forgot Password - send reset link
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const link = `https://modenova.co.ke/reset.html?token=${user._id}`;
    await sendEmail(email, "Reset Your Password", `Click to reset: ${link}`);
    res.json({ message: "✅ Reset link sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Email failed" });
  }
});

// 🔁 Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findById(token);
    if (!user) return res.status(404).json({ message: 'Invalid reset link' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(token, { password: hashedPassword });

    res.json({ message: '✅ Password reset successful!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '❌ Server error' });
  }
});
// ✅ Email Verification
router.get('/verify-email', async (req, res) => {
  const { token, email } = req.query;

  try {
    const user = await User.findOne({ email, verificationToken: token });
    if (!user) return res.status(400).send('❌ Invalid or expired verification link');

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send('✅ Email verified! You can now log in.');
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).send('❌ Server error');
  }
});
// ✅ Email Verification Route
router.post('/verify-email', async (req, res) => {
  const { email, token } = req.body;

  try {
    const user = await User.findOne({ email, verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification link' });

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: '✅ Email verified successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '❌ Server error during verification' });
  }
});
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    const verifyUrl = `https://modenova.co.ke/verify.html?token=${verificationToken}&email=${email}`;
    await sendEmail(email, '🔐 Verify Your Fashion Fit Email', `Click here to verify your account:\n${verifyUrl}`);

    res.json({ message: '📨 Verification email sent again' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '❌ Server error' });
  }
});

module.exports = router;

