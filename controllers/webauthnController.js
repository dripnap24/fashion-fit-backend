const {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} = require('@simplewebauthn/server');

const base64url = require('base64url');
const User = require('../models/user');

const rpName = 'Fashion Fit';
const rpID = 'modenova.co.ke'; // Your custom domain
const origin = 'https://modenova.co.ke';

// Store challenge temporarily per user (in-memory)
const userChallenges = {};

// 👉 Register Step 1: Generate options
exports.generateRegistrationOptions = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const options = generateRegistrationOptions({
    rpName,
    rpID,
    userID: user._id.toString(),
    userName: user.username || email,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'preferred',
    },
  });

  userChallenges[email] = options.challenge;
  res.json(options);
};

// 👉 Register Step 2: Verify response
exports.verifyRegistration = async (req, res) => {
  const { email, attestationResponse } = req.body;

  const expectedChallenge = userChallenges[email];
  if (!expectedChallenge) return res.status(400).json({ message: 'No challenge found' });

  try {
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified) throw new Error('Verification failed');

    // Save credential to user
    const user = await User.findOne({ email });
    user.authenticator = verification.registrationInfo.credentialPublicKey;
    await user.save();

    res.json({ verified: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ verified: false, message: 'Verification failed' });
  }
};

// 👉 Login Step 1: Generate options
exports.generateAuthenticationOptions = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.authenticator) {
    return res.status(404).json({ message: 'No biometric registered' });
  }

  const options = generateAuthenticationOptions({
    timeout: 60000,
    allowCredentials: [{
      id: base64url.toBuffer(user.authenticatorID || ''),
      type: 'public-key',
    }],
    userVerification: 'preferred',
    rpID,
  });

  userChallenges[email] = options.challenge;
  res.json(options);
};

// 👉 Login Step 2: Verify response
exports.verifyAuthentication = async (req, res) => {
  const { email, assertionResponse } = req.body;
  const expectedChallenge = userChallenges[email];

  try {
    const user = await User.findOne({ email });
    if (!user || !user.authenticator) throw new Error('No authenticator found');

    const verified = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: user.authenticator,
        counter: 0,
        credentialID: base64url.toBuffer(user.authenticatorID || ''),
      },
    });

    if (!verified.verified) throw new Error('Auth failed');
    res.json({ verified: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ verified: false });
  }
};
