const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./config/passport'); // ✅ Google OAuth config

dotenv.config();
const app = express();

// 🌐 Middleware
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// 🛣 Routes
const authRoutes = require('./routes/auth');
const webauthnRoutes = require('./routes/webauthn');
app.use('/api/auth', authRoutes);
app.use('/api/webauthn', webauthnRoutes);

// 🌍 Root Test
app.get('/', (req, res) => {
  res.send('💡 Fashion Fit Backend Running...');
});

// 🧠 DB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));


