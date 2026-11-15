require('dotenv').config({ quiet: true });

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const config = {
  isProduction,
  isTest,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  mongoDbName: process.env.MONGODB_DB || 'hackmatch',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  appUrl: (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER,
  verifyTokenHours: 24,
  resetTokenMinutes: 30,
};

if (!config.jwtSecret) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set in production');
  }
  config.jwtSecret = 'dev-only-secret-change-me';
}

module.exports = config;
