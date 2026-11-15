const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { HttpError, escapeRegex } = require('../lib/validation');

const router = express.Router();
router.use(requireAuth);

const PAGE_SIZE = 20;

// Partial, case-insensitive match on name, school, skills and what the
// person is looking for. "rea" finds both "React" and "Andrea". Each word
// must match somewhere, so "react ucf" narrows instead of widening.
router.get('/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const role = typeof req.query.role === 'string' ? req.query.role : '';
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

  if (q.length > 50) {
    throw new HttpError(400, 'Search text must be at most 50 characters');
  }
  if (role && !User.ROLES.includes(role)) {
    throw new HttpError(400, `Role must be one of: ${User.ROLES.join(', ')}`);
  }

  const filter = { isVerified: true, _id: { $ne: req.user._id } };
  if (role) filter.role = role;

  if (q) {
    const conditions = q
      .split(/\s+/)
      .slice(0, 5)
      .map((word) => {
        const pattern = new RegExp(escapeRegex(word), 'i');
        return {
          $or: [
            { firstName: pattern },
            { lastName: pattern },
            { school: pattern },
            { skills: pattern },
            { lookingFor: pattern },
          ],
        };
      });
    filter.$and = conditions;
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ lastName: 1, firstName: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
  ]);

  res.json({
    results: users.map((user) => user.toPublic()),
    total,
    page,
    pageSize: PAGE_SIZE,
  });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, 'Attendee not found');
  }
  const user = await User.findOne({ _id: req.params.id, isVerified: true });
  if (!user) {
    throw new HttpError(404, 'Attendee not found');
  }
  res.json({ attendee: user.toPublic() });
});

module.exports = router;
