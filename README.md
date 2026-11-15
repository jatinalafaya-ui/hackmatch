# HackMatch

HackMatch helps hackathon attendees find teammates and mentors. You create an account, verify your email, fill in your skills and what you're looking for, then search everyone else by name, school or skill. People you want to team up with go on a private shortlist where you track a status and a note for each one.

The same features are available in a React web app and a Flutter mobile app, both talking to one Express + MongoDB API.

COP 4331C Large Project, Fall 2026. Built by Jatin Phalswal.

## Features

- Registration with email verification (single-use link, expires in 24 hours)
- Login with JSON Web Tokens; unverified accounts can't log in
- Forgot password and reset by email (single-use link, expires in 30 minutes)
- Server-side partial-match search over name, school, skills and "looking for", with a role filter
- Personal shortlist with create, read, update and delete, visible only to its owner
- Editable profile (role, school, skills, looking for, bio)
- Login/register is the first screen on both web and mobile

## Tech stack

| Layer | Technology |
| --- | --- |
| Database | MongoDB Atlas, Mongoose |
| API | Node.js, Express 5, JWT (jsonwebtoken), bcrypt (bcryptjs), Nodemailer, Helmet, express-rate-limit |
| Web | React 19, TypeScript, Vite, Bootstrap 5, React Router |
| Mobile | Flutter (Android), http, shared_preferences |
| Hosting | Vercel (web app and API on one domain, HTTPS) |
| Quality | node:test + Supertest + mongodb-memory-server, flutter_test, ESLint, oxlint, GitHub Actions |
| API docs | OpenAPI 3 on SwaggerHub (`docs/api/openapi.yaml`) |

## Repository layout

```
api/index.js          Vercel serverless entry point (exports the Express app)
server/src/           Express app: config, db, models, routes, middleware, lib, seed
server/tests/         API unit and integration tests
web/                  React + TypeScript client
mobile/               Flutter client
docs/api/             OpenAPI spec for SwaggerHub
docs/diagrams/        Use case, activity, sequence and class diagrams, ERD (PlantUML + PNG)
docs/planning/        Gantt chart
docs/prototypes/      Wireframes
.github/workflows/    CI for API, web and mobile
```

## API

All routes are under `/api`. Routes marked "Yes" under Auth need `Authorization: Bearer <token>`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | | Create an account and email a verification link |
| POST | `/auth/verify-email` | | Verify with the emailed token |
| POST | `/auth/resend-verification` | | Send a new verification link |
| POST | `/auth/login` | | Get a JWT (verified accounts only) |
| POST | `/auth/forgot-password` | | Email a reset link (same answer whether or not the email exists) |
| POST | `/auth/reset-password` | | Set a new password with the emailed token |
| GET | `/me` | Yes | Current user |
| PUT | `/me` | Yes | Update profile |
| GET | `/attendees/search?q=&role=&page=` | Yes | Partial-match search, 20 per page |
| GET | `/attendees/:id` | Yes | One attendee |
| GET | `/shortlist` | Yes | My shortlist |
| POST | `/shortlist` | Yes | Add `{ memberId, note?, status? }` |
| PUT | `/shortlist/:id` | Yes | Update `{ note?, status? }` |
| DELETE | `/shortlist/:id` | Yes | Remove |

Errors come back as `{ "error": "message" }` with a matching status code (400, 401, 403, 404, 409, 429).

## Running locally

Requirements: Node.js 20 or newer, a MongoDB connection string (Atlas free tier works), and Flutter 3.50 or newer for the mobile app.

1. Install dependencies:

   ```
   npm install
   npm install --prefix web
   ```

2. Copy `.env.example` to `.env` and fill in `MONGODB_URI` and `JWT_SECRET`. Leave the SMTP settings empty to skip real email locally; the API then builds the messages without sending them.

3. Load the sample attendees and start the API on port 5000:

   ```
   npm run seed
   npm run dev
   ```

4. In a second terminal, start the web app on http://localhost:5173 (it forwards `/api` to port 5000):

   ```
   npm run dev --prefix web
   ```

5. Mobile: run on an Android emulator (it reaches your computer's API at `10.0.2.2:5000`), or point it at the deployed API:

   ```
   cd mobile
   flutter pub get
   flutter run --dart-define=API_URL=https://hackmatch.vercel.app
   ```

   To build an installable APK: `flutter build apk --release --dart-define=API_URL=https://hackmatch.vercel.app`

## Tests

```
npm test                       # 39 API tests: validation, auth, verification, reset, search, shortlist
npm run lint
npm run lint --prefix web
cd mobile && flutter test      # model, API client and login screen tests
```

GitHub Actions runs all three suites on every push and pull request.

## Deployment (Vercel)

1. Import the repository into Vercel. `vercel.json` sets the install and build commands, serves `web/dist` and routes `/api/*` to the Express app.
2. Add the environment variables from `.env.example` with production values, including `SMTP_PASS` (a Gmail app password) and `APP_URL` set to the deployed address.
3. In MongoDB Atlas, allow network access from `0.0.0.0/0`, since Vercel does not use fixed IP addresses.

Each deploy builds the web app and upserts the sample attendees (`npm run seed`). Seeding never deletes real users or shortlist entries.

## Security notes

- Passwords are hashed with bcrypt (cost 12). Email and reset tokens are 32 random bytes; only their SHA-256 hash is stored, they are single use, and MongoDB deletes them on expiry with a TTL index.
- Search input is regex-escaped before it reaches MongoDB, and results never include email addresses.
- Every shortlist query is scoped to the logged-in user, so one user cannot read or change another user's list.
- Auth routes are rate limited (30 requests per 15 minutes per IP).

## License

MIT. See [LICENSE.md](LICENSE.md).
