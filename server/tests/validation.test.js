const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateEmail,
  validatePassword,
  normalizeSkills,
  escapeRegex,
  HttpError,
} = require('../src/lib/validation');
const { hashToken } = require('../src/lib/tokens');

describe('validateEmail', () => {
  test('lowercases and trims a valid address', () => {
    assert.equal(validateEmail('  Jatin@Example.COM '), 'jatin@example.com');
  });

  for (const value of ['', 'no-at-sign', 'a@b', 'two@@signs.com', 'spa ce@x.com']) {
    test(`rejects "${value}"`, () => {
      assert.throws(() => validateEmail(value), HttpError);
    });
  }
});

describe('validatePassword', () => {
  test('accepts 8 characters with a letter and a number', () => {
    assert.equal(validatePassword('abcdefg1'), 'abcdefg1');
  });

  test('rejects 7 characters (boundary)', () => {
    assert.throws(() => validatePassword('abcdef1'), /at least 8/);
  });

  test('accepts 72 characters and rejects 73 (bcrypt boundary)', () => {
    assert.equal(validatePassword('a1'.repeat(36)).length, 72);
    assert.throws(() => validatePassword('a1'.repeat(36) + 'x'), /at most 72/);
  });

  test('rejects letters only and digits only', () => {
    assert.throws(() => validatePassword('abcdefgh'), /letter and a number/);
    assert.throws(() => validatePassword('12345678'), /letter and a number/);
  });
});

describe('normalizeSkills', () => {
  test('splits a comma list, trims and drops case-insensitive duplicates', () => {
    assert.deepEqual(normalizeSkills('React, react , Node.js,,'), ['React', 'Node.js']);
  });

  test('leaves the field alone when it is not sent', () => {
    assert.equal(normalizeSkills(undefined), undefined);
  });

  test('rejects more than 15 skills', () => {
    const many = Array.from({ length: 16 }, (_, i) => `skill${i}`);
    assert.throws(() => normalizeSkills(many), /at most 15/);
  });
});

describe('escapeRegex', () => {
  test('makes regex characters literal so search input cannot inject a pattern', () => {
    const pattern = new RegExp(escapeRegex('C++ (.*)'));
    assert.ok(pattern.test('C++ (.*)'));
    assert.ok(!pattern.test('Cxx anything'));
  });
});

describe('hashToken', () => {
  test('is stable and never returns the raw token', () => {
    const token = 'a'.repeat(64);
    assert.equal(hashToken(token), hashToken(token));
    assert.ok(!hashToken(token).includes(token));
  });
});
