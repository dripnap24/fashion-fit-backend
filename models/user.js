const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },

  // ✅ WebAuthn fields
  authenticator: { type: String, default: null },
  authenticatorID: { type: String, default: null }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

