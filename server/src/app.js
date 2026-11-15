const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const { connectDb } = require('./db');
const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const attendeeRoutes = require('./routes/attendees');
const shortlistRoutes = require('./routes/shortlist');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '20kb' }));

// The web app is served from the same domain, so CORS only matters for
// extra origins listed in CORS_ORIGINS (for example the Vite dev server).
// The Flutter app is not a browser and is not affected by CORS.
app.use(
  '/api',
  cors({
    origin: config.isProduction ? config.corsOrigins : true,
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', async (req, res, next) => {
  await connectDb();
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/attendees', attendeeRoutes);
app.use('/api/shortlist', shortlistRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// When running as one Node server (local or a VPS), also serve the built
// React app. On Vercel the static files are served by the platform.
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({ error: status === 500 ? 'Something went wrong on our end' : err.message });
});

module.exports = app;
