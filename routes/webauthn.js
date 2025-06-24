const express = require('express');
const router = express.Router();
const {
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication
} = require('../controllers/webauthnController');

router.post('/generate-registration-options', generateRegistrationOptions);
router.post('/verify-registration', verifyRegistration);
router.post('/generate-authentication-options', generateAuthenticationOptions);
router.post('/verify-authentication', verifyAuthentication);

module.exports = router;

