const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SKILLS = 15;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireString(value, field, { max = 100 } = {}) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, `${field} is required`);
  }
  if (value.trim().length > max) {
    throw new HttpError(400, `${field} must be at most ${max} characters`);
  }
  return value.trim();
}

function optionalString(value, field, { max = 100 } = {}) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be text`);
  }
  if (value.trim().length > max) {
    throw new HttpError(400, `${field} must be at most ${max} characters`);
  }
  return value.trim();
}

function validateEmail(value) {
  const email = requireString(value, 'Email', { max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new HttpError(400, 'Email is not a valid address');
  }
  return email;
}

// At least 8 characters with a letter and a number. Max 72 because bcrypt
// ignores anything past 72 bytes.
function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters');
  }
  if (value.length > 72) {
    throw new HttpError(400, 'Password must be at most 72 characters');
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    throw new HttpError(400, 'Password must contain a letter and a number');
  }
  return value;
}

function normalizeSkills(value) {
  if (value === undefined) {
    return undefined;
  }
  const list = Array.isArray(value) ? value : String(value).split(',');
  const seen = new Set();
  const skills = [];
  for (const raw of list) {
    if (typeof raw !== 'string') continue;
    const skill = raw.trim();
    if (!skill || skill.length > 30 || seen.has(skill.toLowerCase())) continue;
    seen.add(skill.toLowerCase());
    skills.push(skill);
  }
  if (skills.length > MAX_SKILLS) {
    throw new HttpError(400, `You can list at most ${MAX_SKILLS} skills`);
  }
  return skills;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  HttpError,
  requireString,
  optionalString,
  validateEmail,
  validatePassword,
  normalizeSkills,
  escapeRegex,
};
