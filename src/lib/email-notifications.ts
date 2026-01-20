/**
 * Email Notifications System
 * Centralized email delivery via Resend API
 * Support for transactional, newsletter, and admin notifications
 */

import { Resend } from 'resend';

let resendClient: Resend | null = null;
let hasLoggedMissingKey = false;

const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!hasLoggedMissingKey) {
      // Log once to avoid noisy console spam during builds
      console.warn('[EmailNotifications] RESEND_API_KEY not configured; emails disabled');
      hasLoggedMissingKey = true;
    }
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
};

/**
 * Email configuration with centralized sender addresses
 */
export const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'info@tv25.app',
  support: process.env.RESEND_REPLY_TO || 'support@tv25.app',
  admin: 'admin@tv25.app',
  senderName: 'Info Center - tv25.app'
} as const;

export interface EmailMetadata {
  userId?: string;
  campaignId?: string;
  templateId?: string;
  [key: string]: any;
}

/**
 * Send a transactional email (signup confirmation, password reset, etc.)
 */
export async function sendTransactionalEmail(
  email: string,
  subject: string,
  htmlContent: string,
  metadata?: EmailMetadata
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject,
      html: htmlContent,
      replyTo: EMAIL_CONFIG.support,
      headers: {
        'X-Entity-Ref-ID': metadata?.userId || 'unknown',
        'X-Campaign-Id': metadata?.campaignId || 'transactional',
        'X-Template-Id': metadata?.templateId || 'default',
      },
    });

    if (response.error) {
      console.error(`[EmailNotifications] Failed to send to ${email}:`, response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    console.error(`[EmailNotifications] Exception sending email to ${email}:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send newsletter email to multiple subscribers
 */
export async function sendNewsletterEmail(
  subscribers: string[],
  subject: string,
  htmlContent: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  // Send in batches to avoid rate limiting (Resend allows ~100 emails/second)
  const batchSize = 50;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (email) => {
        const result = await sendTransactionalEmail(email, subject, htmlContent, {
          campaignId: 'newsletter',
        });
        
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${email}: ${result.error}`);
        }
      })
    );

    // Small delay between batches
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Send admin notification
 */
export async function sendAdminNotification(
  subject: string,
  htmlContent: string,
  type: 'signup' | 'payment' | 'error' | 'alert' = 'alert',
  metadata?: EmailMetadata
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.admin,
      subject: `[${type.toUpperCase()}] ${subject}`,
      html: htmlContent,
      replyTo: EMAIL_CONFIG.support,
      headers: {
        'X-Notification-Type': type,
        'X-Entity-Ref-ID': metadata?.userId || 'system',
        'X-Timestamp': new Date().toISOString(),
      },
    });

    if (response.error) {
      console.error(`[EmailNotifications] Failed to send admin notification:`, response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(`[EmailNotifications] Exception sending admin notification:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send signup confirmation email
 */
export async function sendSignupConfirmationEmail(
  email: string,
  confirmUrl: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>E-posta Doğrulaması</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .button { background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CanvasFlow'a Hoş Geldiniz!</h1>
        </div>
        
        <p>Merhaba${userName ? ` ${userName}` : ''},</p>
        
        <p>Kaydınızı tamamlamak için lütfen aşağıdaki butona tıklayın:</p>
        
        <center>
          <a href="${confirmUrl}" class="button">E-posta Adresini Doğrula</a>
        </center>
        
        <p>Eğer bu linki tıklayamazsanız, aşağıdaki adresi kopyalayarak tarayıcınıza yapıştırabilirsiniz:</p>
        <p style="word-break: break-all; color: #3b82f6;">${confirmUrl}</p>
        
        <p>Bu link 24 saat içinde geçerlidir.</p>
        
        <p>Sorularınız için bizimle iletişime geçmekten çekinmeyin.<br>
        Saygılarımızla,<br>
        <strong>CanvasFlow Ekibi</strong></p>
        
        <div class="footer">
          <p>© 2025 CanvasFlow. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail(email, 'E-posta Doğrulaması - CanvasFlow', htmlContent, {
    templateId: 'signup-confirmation',
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Şifre Sıfırlama</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .warning { background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Şifrenizi Sıfırlayın</h1>
        
        <p>Hesabınız için bir şifre sıfırlama isteği alındı.</p>
        
        <center>
          <a href="${resetUrl}" class="button">Şifrenizi Sıfırla</a>
        </center>
        
        <div class="warning">
          <p><strong>Uyarı:</strong> Bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        </div>
        
        <p>Link 1 saat geçerlidir.</p>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail(email, 'Şifre Sıfırlama - CanvasFlow', htmlContent, {
    templateId: 'password-reset',
  });
}

/**
 * Notify admin about new signup
 */
export async function notifyAdminNewSignup(
  email: string,
  username: string,
  joinDate: Date
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>Yeni Kullanıcı Kaydı</h2>
      <p><strong>E-posta:</strong> ${email}</p>
      <p><strong>Kullanıcı Adı:</strong> ${username}</p>
      <p><strong>Kaydolma Tarihi:</strong> ${joinDate.toLocaleString('tr-TR')}</p>
      <p><strong>Saat:</strong> ${joinDate.toLocaleTimeString('tr-TR')}</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        Bu otomatik bir bildirimdir. Lütfen yanıt vermeyin.
      </p>
    </div>
  `;

  return sendAdminNotification(
    `Yeni Kullanıcı: ${username}`,
    htmlContent,
    'signup',
    { userId: email }
  );
}

/**
 * Notify admin about payment
 */
export async function notifyAdminPayment(
  amount: number,
  currency: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>Yeni Ödeme Alındı</h2>
      <p><strong>Kullanıcı ID:</strong> ${userId}</p>
      <p><strong>Tutar:</strong> ${amount} ${currency}</p>
      <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        Bu otomatik bir bildirimdir. Lütfen yanıt vermeyin.
      </p>
    </div>
  `;

  return sendAdminNotification(
    `Ödeme: ${amount} ${currency}`,
    htmlContent,
    'payment',
    { userId }
  );
}

/**
 * Notify admin about error
 */
export async function notifyAdminError(
  errorMessage: string,
  context?: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>⚠️ Sistem Hatası</h2>
      <p><strong>Hata Mesajı:</strong></p>
      <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px; overflow-x: auto;">
${errorMessage}
      </pre>
      ${context ? `<p><strong>Konteks:</strong> ${context}</p>` : ''}
      <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        Bu otomatik bir bildirimdir. Lütfen yanıt vermeyin.
      </p>
    </div>
  `;

  return sendAdminNotification(
    'Sistem Hatası Oluştu',
    htmlContent,
    'error'
  );
}
