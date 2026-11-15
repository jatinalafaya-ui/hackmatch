const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const AuthToken = require('../models/AuthToken');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Only the hash is stored, so a leaked database can't be used to verify
// accounts or reset passwords.
async function issueEmailToken(userId, purpose) {
  const token = crypto.randomBytes(32).toString('hex');
  const ttlMs =
    purpose === 'verify'
      ? config.verifyTokenHours * 60 * 60 * 1000
      : config.resetTokenMinutes * 60 * 1000;

  await AuthToken.deleteMany({ user: userId, purpose });
  await AuthToken.create({
    user: userId,
    purpose,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

async function consumeEmailToken(token, purpose) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }
  const record = await AuthToken.findOneAndDelete({
    tokenHash: hashToken(token),
    purpose,
    expiresAt: { $gt: new Date() },
  });
  return record ? record.user : null;
}

function signSession(user) {
  return jwt.sign({ sub: user._id.toString() }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function verifySession(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { hashToken, issueEmailToken, consumeEmailToken, signSession, verifySession };
