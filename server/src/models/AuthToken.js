const mongoose = require('mongoose');

const authTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purpose: { type: String, enum: ['verify', 'reset'], required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

// MongoDB removes expired tokens on its own through this TTL index.
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthToken', authTokenSchema);
