// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // limit each IP to 5 requests per minute
  message: '⛔ Too many requests. Please try again later.',
});

module.exports = authLimiter;
