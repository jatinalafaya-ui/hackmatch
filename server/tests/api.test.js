const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { connectDb, disconnectDb } = require('../src/db');
const { outbox } = require('../src/lib/mailer');
const { seed } = require('../src/seed');

let mongo;

function lastLinkToken(email) {
  const message = [...outbox].reverse().find((m) => m.to === email);
  const match = message && message.text.match(/token=([a-f0-9]{64})/);
  return match ? match[1] : null;
}

async function registerAndLogin(email, password = 'hackmatch1') {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password, firstName: 'Test', lastName: 'User' })
    .expect(201);
  await request(app)
    .post('/api/auth/verify-email')
    .send({ token: lastLinkToken(email) })
    .expect(200);
  const res = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  return res.body.token;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  await seed();
});

after(async () => {
  await disconnectDb();
  await mongo.stop();
});

describe('registration and email verification', () => {
  const email = 'newuser@example.com';
  const password = 'secret123';

  test('register creates an unverified account and emails a link', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, firstName: 'Jatin', lastName: 'Phalswal' })
      .expect(201);
    assert.match(res.body.message, /check your email/i);
    assert.ok(lastLinkToken(email));
  });

  test('duplicate email is rejected with 409, ignoring case', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'NewUser@Example.com', password, firstName: 'A', lastName: 'B' })
      .expect(409);
  });

  test('login is blocked until the email is verified', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password }).expect(403);
    assert.match(res.body.error, /verify/i);
  });

  test('a made-up verification token is rejected', async () => {
    await request(app).post('/api/auth/verify-email').send({ token: 'f'.repeat(64) }).expect(400);
  });

  test('the emailed token verifies the account, then works only once', async () => {
    const token = lastLinkToken(email);
    await request(app).post('/api/auth/verify-email').send({ token }).expect(200);
    await request(app).post('/api/auth/verify-email').send({ token }).expect(400);
  });

  test('login returns a JWT and the user without the password hash', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    assert.equal(res.body.token.split('.').length, 3);
    assert.equal(res.body.user.email, email);
    assert.equal(res.body.user.passwordHash, undefined);
  });

  test('wrong password gets the same message as an unknown email', async () => {
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'nope12345' })
      .expect(401);
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'nope12345' })
      .expect(401);
    assert.equal(wrong.body.error, unknown.body.error);
  });
});

describe('password reset', () => {
  const email = 'forgetful@example.com';

  before(async () => {
    await registerAndLogin(email, 'original1');
  });

  test('forgot-password answers the same for unknown emails', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
      .expect(200);
    assert.match(res.body.message, /if an account exists/i);
  });

  test('reset link changes the password and the old one stops working', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email }).expect(200);
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: lastLinkToken(email), password: 'brandnew2' })
      .expect(200);
    await request(app).post('/api/auth/login').send({ email, password: 'original1' }).expect(401);
    await request(app).post('/api/auth/login').send({ email, password: 'brandnew2' }).expect(200);
  });

  test('a weak new password is rejected', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email }).expect(200);
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: lastLinkToken(email), password: 'short' })
      .expect(400);
  });
});

describe('protected routes', () => {
  test('requests without a token get 401', async () => {
    await request(app).get('/api/attendees/search?q=react').expect(401);
    await request(app).get('/api/shortlist').expect(401);
  });

  test('a tampered token gets 401', async () => {
    await request(app).get('/api/me').set(auth('abc.def.ghi')).expect(401);
  });
});

describe('partial-match search', () => {
  let token;

  before(async () => {
    token = await registerAndLogin('searcher@example.com');
  });

  test('a fragment matches names and skills, case-insensitively', async () => {
    const res = await request(app).get('/api/attendees/search?q=REA').set(auth(token)).expect(200);
    const names = res.body.results.map((p) => `${p.firstName} ${p.lastName}`);
    assert.ok(names.includes('Andrea Lopez'));
    assert.ok(names.includes('Leah Goldberg'));
    assert.ok(names.includes('Jordan Patel'));
    assert.ok(!names.includes('Kevin Tran'));
    assert.ok(res.body.results.every((p) => p.email === undefined));
  });

  test('every word must match, so extra words narrow the results', async () => {
    const res = await request(app)
      .get('/api/attendees/search?q=flutter usf')
      .set(auth(token))
      .expect(200);
    assert.deepEqual(
      res.body.results.map((p) => p.lastName),
      ['Natarajan']
    );
  });

  test('role filter returns only mentors', async () => {
    const res = await request(app).get('/api/attendees/search?role=mentor').set(auth(token)).expect(200);
    assert.ok(res.body.total > 0);
    assert.ok(res.body.results.every((p) => p.role === 'mentor'));
  });

  test('regex characters are treated as plain text', async () => {
    const res = await request(app)
      .get('/api/attendees/search?q=' + encodeURIComponent('.*'))
      .set(auth(token))
      .expect(200);
    assert.equal(res.body.total, 0);
  });

  test('unverified accounts never show up in search', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'hidden@example.com', password: 'hidden123', firstName: 'Zzhidden', lastName: 'Person' })
      .expect(201);
    const res = await request(app).get('/api/attendees/search?q=zzhidden').set(auth(token)).expect(200);
    assert.equal(res.body.total, 0);
  });
});

describe('shortlist CRUD is scoped to its owner', () => {
  let alice;
  let bob;
  let memberId;
  let entryId;

  before(async () => {
    alice = await registerAndLogin('alice@example.com');
    bob = await registerAndLogin('bob@example.com');
    const res = await request(app).get('/api/attendees/search?q=natarajan').set(auth(alice));
    memberId = res.body.results[0].id;
  });

  test('create', async () => {
    const res = await request(app)
      .post('/api/shortlist')
      .set(auth(alice))
      .send({ memberId, note: 'Flutter help' })
      .expect(201);
    entryId = res.body.entry.id;
    assert.equal(res.body.entry.member.lastName, 'Natarajan');
    assert.equal(res.body.entry.status, 'interested');
  });

  test('adding the same person twice is a 409', async () => {
    await request(app).post('/api/shortlist').set(auth(alice)).send({ memberId }).expect(409);
  });

  test('read and update', async () => {
    await request(app)
      .put(`/api/shortlist/${entryId}`)
      .set(auth(alice))
      .send({ note: 'Messaged on Discord', status: 'contacted' })
      .expect(200);
    const res = await request(app).get('/api/shortlist').set(auth(alice)).expect(200);
    assert.equal(res.body.entries.length, 1);
    assert.equal(res.body.entries[0].note, 'Messaged on Discord');
    assert.equal(res.body.entries[0].status, 'contacted');
  });

  test('an invalid status is rejected', async () => {
    await request(app).put(`/api/shortlist/${entryId}`).set(auth(alice)).send({ status: 'married' }).expect(400);
  });

  test("another user can't see, edit or delete it", async () => {
    const list = await request(app).get('/api/shortlist').set(auth(bob)).expect(200);
    assert.equal(list.body.entries.length, 0);
    await request(app).put(`/api/shortlist/${entryId}`).set(auth(bob)).send({ note: 'hijacked' }).expect(404);
    await request(app).delete(`/api/shortlist/${entryId}`).set(auth(bob)).expect(404);
  });

  test('delete', async () => {
    await request(app).delete(`/api/shortlist/${entryId}`).set(auth(alice)).expect(204);
    const res = await request(app).get('/api/shortlist').set(auth(alice)).expect(200);
    assert.equal(res.body.entries.length, 0);
  });
});

describe('profile', () => {
  test('a user can update their own profile', async () => {
    const token = await registerAndLogin('profile@example.com');
    const res = await request(app)
      .put('/api/me')
      .set(auth(token))
      .send({ role: 'mentor', skills: 'MongoDB, Express', school: 'UCF' })
      .expect(200);
    assert.equal(res.body.user.role, 'mentor');
    assert.deepEqual(res.body.user.skills, ['MongoDB', 'Express']);
    assert.equal(res.body.user.school, 'UCF');
  });
});
