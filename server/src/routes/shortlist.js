const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const ShortlistEntry = require('../models/ShortlistEntry');
const { requireAuth } = require('../middleware/auth');
const { HttpError, optionalString } = require('../lib/validation');

const router = express.Router();
router.use(requireAuth);

function toJson(entry) {
  return {
    id: entry._id.toString(),
    note: entry.note,
    status: entry.status,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    member: entry.member && entry.member.toPublic ? entry.member.toPublic() : null,
  };
}

function readStatus(value) {
  if (value === undefined) return undefined;
  if (!ShortlistEntry.STATUSES.includes(value)) {
    throw new HttpError(400, `Status must be one of: ${ShortlistEntry.STATUSES.join(', ')}`);
  }
  return value;
}

// Every query is scoped to req.user, so one user can never read or change
// another user's shortlist.
async function findOwnEntry(req) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, 'Shortlist entry not found');
  }
  const entry = await ShortlistEntry.findOne({ _id: req.params.id, owner: req.user._id });
  if (!entry) {
    throw new HttpError(404, 'Shortlist entry not found');
  }
  return entry;
}

router.get('/', async (req, res) => {
  const entries = await ShortlistEntry.find({ owner: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('member');
  res.json({ entries: entries.filter((entry) => entry.member).map(toJson) });
});

router.post('/', async (req, res) => {
  const { memberId } = req.body;
  if (!mongoose.isValidObjectId(memberId)) {
    throw new HttpError(400, 'memberId is required');
  }
  if (memberId === req.user._id.toString()) {
    throw new HttpError(400, "You can't add yourself to your shortlist");
  }
  const member = await User.findOne({ _id: memberId, isVerified: true });
  if (!member) {
    throw new HttpError(404, 'Attendee not found');
  }

  const exists = await ShortlistEntry.exists({ owner: req.user._id, member: member._id });
  if (exists) {
    throw new HttpError(409, `${member.firstName} is already on your shortlist`);
  }

  const entry = await ShortlistEntry.create({
    owner: req.user._id,
    member: member._id,
    note: optionalString(req.body.note, 'Note', { max: 300 }) ?? '',
    status: readStatus(req.body.status) ?? 'interested',
  });
  entry.member = member;
  res.status(201).json({ entry: toJson(entry) });
});

router.put('/:id', async (req, res) => {
  const entry = await findOwnEntry(req);
  const note = optionalString(req.body.note, 'Note', { max: 300 });
  const status = readStatus(req.body.status);
  if (note !== undefined) entry.note = note;
  if (status !== undefined) entry.status = status;
  await entry.save();
  await entry.populate('member');
  res.json({ entry: toJson(entry) });
});

router.delete('/:id', async (req, res) => {
  const entry = await findOwnEntry(req);
  await entry.deleteOne();
  res.status(204).end();
});

module.exports = router;
