const mongoose = require('mongoose');

const STATUSES = ['interested', 'contacted', 'teamed'];

const shortlistEntrySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    status: { type: String, enum: STATUSES, default: 'interested' },
  },
  { timestamps: true }
);

shortlistEntrySchema.index({ owner: 1, member: 1 }, { unique: true });

module.exports = mongoose.model('ShortlistEntry', shortlistEntrySchema);
module.exports.STATUSES = STATUSES;
