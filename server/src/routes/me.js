const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const {
  HttpError,
  requireString,
  optionalString,
  normalizeSkills,
} = require('../lib/validation');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ user: req.user.toSelf() });
});

router.put('/', async (req, res) => {
  const body = req.body;
  const user = req.user;

  if (body.firstName !== undefined) user.firstName = requireString(body.firstName, 'First name', { max: 50 });
  if (body.lastName !== undefined) user.lastName = requireString(body.lastName, 'Last name', { max: 50 });
  if (body.role !== undefined) {
    if (!User.ROLES.includes(body.role)) {
      throw new HttpError(400, `Role must be one of: ${User.ROLES.join(', ')}`);
    }
    user.role = body.role;
  }

  const school = optionalString(body.school, 'School', { max: 100 });
  const lookingFor = optionalString(body.lookingFor, 'Looking for', { max: 200 });
  const bio = optionalString(body.bio, 'Bio', { max: 500 });
  const skills = normalizeSkills(body.skills);
  if (school !== undefined) user.school = school;
  if (lookingFor !== undefined) user.lookingFor = lookingFor;
  if (bio !== undefined) user.bio = bio;
  if (skills !== undefined) user.skills = skills;

  await user.save();
  res.json({ user: user.toSelf() });
});

module.exports = router;
