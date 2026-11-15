const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
const outbox = [];

function getTransporter() {
  if (transporter) return transporter;

  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  } else if (config.isProduction) {
    throw new Error('SMTP settings are missing; cannot send email in production');
  } else {
    // Local development and tests: build the message without sending it.
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(heading, text, buttonLabel, link) {
  return `<!doctype html>
<html lang="en"><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px">
<tr><td>
<p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#1e3a8a">HackMatch</p>
<h1 style="font-size:22px;margin:0 0 16px">${heading}</h1>
<p style="font-size:15px;line-height:1.5;margin:0 0 24px">${text}</p>
<a href="${link}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${buttonLabel}</a>
<p style="font-size:13px;color:#6b7280;margin:24px 0 0">If the button doesn't work, paste this link into your browser:<br>${link}</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function send(to, subject, text, html) {
  const message = { from: `HackMatch <${config.mailFrom}>`, to, subject, text, html };
  await getTransporter().sendMail(message);
  if (!config.isProduction) {
    outbox.push(message);
  }
}

async function sendVerificationEmail(user, token) {
  const link = `${config.appUrl}/verify?token=${token}`;
  await send(
    user.email,
    'Verify your HackMatch email',
    `Hi ${user.firstName}, confirm your email to finish creating your HackMatch account: ${link}\nThis link expires in ${config.verifyTokenHours} hours.`,
    layout(
      `Welcome, ${escapeHtml(user.firstName)}!`,
      `Confirm your email to finish creating your account. This link expires in ${config.verifyTokenHours} hours.`,
      'Verify email',
      link
    )
  );
}

async function sendPasswordResetEmail(user, token) {
  const link = `${config.appUrl}/reset-password?token=${token}`;
  await send(
    user.email,
    'Reset your HackMatch password',
    `Hi ${user.firstName}, reset your HackMatch password here: ${link}\nThis link expires in ${config.resetTokenMinutes} minutes. If you didn't ask for this, ignore this email.`,
    layout(
      'Reset your password',
      `We got a request to reset your password. This link expires in ${config.resetTokenMinutes} minutes. If you didn't ask for this, you can ignore this email.`,
      'Choose a new password',
      link
    )
  );
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, outbox };
