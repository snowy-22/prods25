#!/usr/bin/env node
import 'dotenv/config';
import { Resend } from 'resend';

// --- Config ---
const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'info@tv25.app';
const replyTo = process.env.RESEND_REPLY_TO || 'support@tv25.app';

const recipients = [
  { email: 'dorukkar@gmail.com', name: 'Doruk' },
  { email: 'dorurkkarlikaya@gmail.com', name: 'Dorurk Karlikaya' },
];

if (!apiKey) {
  console.error('❌ RESEND_API_KEY is missing. Set it in env and re-run.');
  process.exit(1);
}

const resend = new Resend(apiKey);

const subject = 'tv25.app hatırlatması: Yeni e-posta şablonları hazır';
const html = (name) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 16px; background: #f7f9fc;">
    <h2 style="color: #2d2f83;">Merhaba ${name || ''},</h2>
    <p>tv25.app için e-posta şablonları ve Resend entegrasyonu hazır. Hatırlatma:</p>
    <ul>
      <li>Welcome ve doğrulama şablonları yüklendi.</li>
      <li>Resend üzerinden gönderim aktif (API key gerekli).</li>
      <li>Env: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_REPLY_TO.</li>
    </ul>
    <p style="margin-top: 16px;">Sorun yaşarsan: support@tv25.app</p>
    <p style="color: #888; font-size: 12px; margin-top: 24px;">tv25.app</p>
  </div>
`;

async function main() {
  for (const { email, name } of recipients) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject,
        html: html(name),
        reply_to: replyTo,
      });
      if (error) throw error;
      console.log(`✅ Sent to ${email} (id: ${data?.id || 'n/a'})`);
    } catch (err) {
      console.error(`❌ Failed to send to ${email}:`, err?.message || err);
      process.exitCode = 1;
    }
  }
}

main();
