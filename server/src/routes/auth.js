const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const User = require('../models/User');
const { issueEmailToken, consumeEmailToken, signSession } = require('../lib/tokens');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../lib/mailer');
const {
  HttpError,
  requireString,
  validateEmail,
  validatePassword,
} = require('../lib/validation');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});
router.use(authLimiter);

router.post('/register', async (req, res) => {
  const email = validateEmail(req.body.email);
  const password = validatePassword(req.body.password);
  const firstName = requireString(req.body.firstName, 'First name', { max: 50 });
  const lastName = requireString(req.body.lastName, 'Last name', { max: 50 });

  const existing = await User.findOne({ email });
  if (existing) {
    throw new HttpError(409, 'An account with that email already exists');
  }

  const user = await User.create({
    email,
    firstName,
    lastName,
    passwordHash: await bcrypt.hash(password, 12),
  });

  const token = await issueEmailToken(user._id, 'verify');
  await sendVerificationEmail(user, token);

  res.status(201).json({ message: 'Account created. Check your email to verify it.' });
});

router.post('/verify-email', async (req, res) => {
  const userId = await consumeEmailToken(req.body.token, 'verify');
  if (!userId) {
    throw new HttpError(400, 'This verification link is invalid or has expired');
  }
  const user = await User.findByIdAndUpdate(userId, { isVerified: true }, { returnDocument: 'after' });
  if (!user) {
    throw new HttpError(400, 'This verification link is invalid or has expired');
  }
  res.json({ message: 'Email verified. You can log in now.' });
});

router.post('/resend-verification', async (req, res) => {
  const email = validateEmail(req.body.email);
  const user = await User.findOne({ email });
  if (user && !user.isVerified) {
    const token = await issueEmailToken(user._id, 'verify');
    await sendVerificationEmail(user, token);
  }
  res.json({ message: 'If that account needs verifying, a new link is on its way.' });
});

router.post('/login', async (req, res) => {
  const email = validateEmail(req.body.email);
  const password = requireString(req.body.password, 'Password', { max: 72 });

  const user = await User.findOne({ email });
  const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordOk) {
    throw new HttpError(401, 'Email or password is incorrect');
  }
  if (!user.isVerified) {
    throw new HttpError(403, 'Verify your email before logging in');
  }

  res.json({ token: signSession(user), user: user.toSelf() });
});

// Always answers the same way so the endpoint can't be used to find out
// which emails have accounts.
router.post('/forgot-password', async (req, res) => {
  const email = validateEmail(req.body.email);
  const user = await User.findOne({ email });
  if (user) {
    const token = await issueEmailToken(user._id, 'reset');
    await sendPasswordResetEmail(user, token);
  }
  res.json({ message: 'If an account exists for that email, a reset link is on its way.' });
});

router.post('/reset-password', async (req, res) => {
  const password = validatePassword(req.body.password);
  const userId = await consumeEmailToken(req.body.token, 'reset');
  if (!userId) {
    throw new HttpError(400, 'This reset link is invalid or has expired');
  }
  // Clicking the emailed link also proves the user owns the address.
  await User.findByIdAndUpdate(userId, {
    passwordHash: await bcrypt.hash(password, 12),
    isVerified: true,
  });
  res.json({ message: 'Password updated. You can log in now.' });
});

module.exports = router;
