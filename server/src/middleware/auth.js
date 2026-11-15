const mongoose = require('mongoose');
const User = require('../models/User');
const { verifySession } = require('../lib/tokens');
const { HttpError } = require('../lib/validation');

async function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Log in to continue');
  }

  let payload;
  try {
    payload = verifySession(token);
  } catch {
    throw new HttpError(401, 'Your session has expired. Log in again.');
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw new HttpError(401, 'Log in to continue');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isVerified) {
    throw new HttpError(401, 'Log in to continue');
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };
