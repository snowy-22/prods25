/**
 * Email Service
 * Handles sending emails via Supabase Auth or Resend email provider
 */

import { createClient } from './supabase/client';
import {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  accountActivationEmailTemplate,
  referralEmailTemplate,
  promotionalEmailTemplate,
  notificationEmailTemplate,
} from './emails/templates/index';

export type EmailType = 
  | 'welcome'
  | 'password_reset'
  | 'activation'
  | 'referral'
  | 'promotional'
  | 'notification';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
}

/**
 * Send email via Supabase
 * Uses Supabase's built-in email service
 */
export async function sendEmailViaSupabase(options: SendEmailOptions) {
  try {
    const supabase = createClient();
    
    // In production, use Supabase Functions or external email service
    // For now, we'll log the email
    console.log(`📧 Email queued: ${options.subject} → ${options.to}`);
    
    // TODO: Integrate with actual email service
    // Option 1: Supabase Edge Functions with Resend
    // Option 2: SendGrid / Mailgun API
    // Option 3: AWS SES
    
    return {
      success: true,
      messageId: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(userName: string, userEmail: string) {
  const html = welcomeEmailTemplate(userName, userEmail);
  
  return sendEmailViaSupabase({
    to: userEmail,
    subject: '🎉 CanvasFlow\'a Hoş Geldiniz!',
    html,
    replyTo: 'support@canvasflow.example.com',
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userName: string,
  userEmail: string,
  resetLink: string,
  expiresIn: string = '1 saat'
) {
  const html = passwordResetEmailTemplate(userName, resetLink, expiresIn);
  
  return sendEmailViaSupabase({
    to: userEmail,
    subject: '🔐 Şifre Sıfırlama Talebiniz',
    html,
    replyTo: 'support@canvasflow.example.com',
  });
}

/**
 * Send account activation email
 */
export async function sendAccountActivationEmail(
  userName: string,
  userEmail: string,
  confirmLink: string,
  expiresIn: string = '24 saat'
) {
  const html = accountActivationEmailTemplate(userName, confirmLink, expiresIn);
  
  return sendEmailViaSupabase({
    to: userEmail,
    subject: '✉️ E-posta Doğrulaması - CanvasFlow',
    html,
    replyTo: 'support@canvasflow.example.com',
  });
}

/**
 * Send referral notification email
 */
export async function sendReferralEmail(
  referrerName: string,
  referrerEmail: string,
  referralName: string,
  referralEmail: string,
  bonusCredit?: string
) {
  const html = referralEmailTemplate(referrerName, referralName, referralEmail, bonusCredit);
  
  return sendEmailViaSupabase({
    to: referrerEmail,
    subject: `🎁 ${referralName} CanvasFlow\'a Katıldı!`,
    html,
    replyTo: 'support@canvasflow.example.com',
  });
}

/**
 * Send promotional email
 */
export async function sendPromotionalEmail(
  userEmail: string,
  userName: string,
  promoTitle: string,
  promoDescription: string,
  promoImage?: string,
  ctaText: string = 'Daha Fazla Bilgi Al',
  ctaLink: string = 'https://canvasflow.example.com'
) {
  const html = promotionalEmailTemplate(
    userName,
    promoTitle,
    promoDescription,
    promoImage,
    ctaText,
    ctaLink
  );
  
  return sendEmailViaSupabase({
    to: userEmail,
    subject: `✨ ${promoTitle}`,
    html,
    replyTo: 'marketing@canvasflow.example.com',
  });
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  userEmail: string,
  userName: string,
  notificationType: 'security' | 'activity' | 'achievement' | 'reminder',
  notificationTitle: string,
  notificationContent: string,
  actionLink?: string,
  actionText?: string
) {
  const html = notificationEmailTemplate(
    userName,
    notificationType,
    notificationTitle,
    notificationContent,
    actionLink,
    actionText
  );
  
  const subjectMap = {
    security: '🔒 Güvenlik Uyarısı',
    activity: '📢 Aktivite Bildirim',
    achievement: '🏆 Başarı Kazanıldı!',
    reminder: '⏰ Hatırlatma',
  };
  
  return sendEmailViaSupabase({
    to: userEmail,
    subject: `${subjectMap[notificationType]} - ${notificationTitle}`,
    html,
    replyTo: 'support@canvasflow.example.com',
  });
}

/**
 * Send bulk email to multiple recipients
 */
export async function sendBulkEmail(
  recipients: Array<{ email: string; name: string }>,
  emailType: EmailType,
  data: Record<string, any>
) {
  const results = await Promise.allSettled(
    recipients.map(({ email, name }) => {
      switch (emailType) {
        case 'welcome':
          return sendWelcomeEmail(name, email);
        case 'promotional':
          return sendPromotionalEmail(
            email,
            name,
            data.title,
            data.description,
            data.image,
            data.ctaText,
            data.ctaLink
          );
        case 'notification':
          return sendNotificationEmail(
            email,
            name,
            data.type,
            data.title,
            data.content,
            data.actionLink,
            data.actionText
          );
        default:
          throw new Error(`Unsupported email type: ${emailType}`);
      }
    })
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`✅ Bulk email sent: ${successful} successful, ${failed} failed`);
  
  return {
    successful,
    failed,
    total: results.length,
  };
}

/**
 * Email queue for retry on failure
 */
export interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  html: string;
  type: EmailType;
  retries: number;
  lastAttempt: string;
  nextRetry: string;
  status: 'pending' | 'sent' | 'failed';
}

// Simple in-memory queue (replace with database for production)
const emailQueue: Map<string, EmailQueueItem> = new Map();

/**
 * Queue email for sending (with retry logic)
 */
export function queueEmail(
  to: string,
  subject: string,
  html: string,
  type: EmailType,
  maxRetries: number = 3
): string {
  const id = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const item: EmailQueueItem = {
    id,
    to,
    subject,
    html,
    type,
    retries: 0,
    lastAttempt: new Date().toISOString(),
    nextRetry: new Date().toISOString(),
    status: 'pending',
  };
  
  emailQueue.set(id, item);
  
  // Process queue item
  processEmailQueue(id, maxRetries);
  
  return id;
}

/**
 * Process queued email with retry logic
 */
async function processEmailQueue(emailId: string, maxRetries: number) {
  const item = emailQueue.get(emailId);
  if (!item) return;
  
  try {
    await sendEmailViaSupabase({
      to: item.to,
      subject: item.subject,
      html: item.html,
    });
    
    item.status = 'sent';
    console.log(`✅ Email sent: ${emailId}`);
  } catch (error) {
    item.retries++;
    item.lastAttempt = new Date().toISOString();
    
    if (item.retries >= maxRetries) {
      item.status = 'failed';
      console.error(`❌ Email failed after ${maxRetries} retries: ${emailId}`, error);
    } else {
      // Schedule retry (exponential backoff: 5min, 15min, 30min)
      const delayMs = Math.min(5 * 60 * 1000 * item.retries, 30 * 60 * 1000);
      item.nextRetry = new Date(Date.now() + delayMs).toISOString();
      
      setTimeout(() => processEmailQueue(emailId, maxRetries), delayMs);
      console.log(`⏳ Email retry scheduled: ${emailId} (attempt ${item.retries}/${maxRetries})`);
    }
  }
}

/**
 * Get email queue status
 */
export function getEmailQueueStatus() {
  const pending = Array.from(emailQueue.values()).filter(e => e.status === 'pending');
  const sent = Array.from(emailQueue.values()).filter(e => e.status === 'sent');
  const failed = Array.from(emailQueue.values()).filter(e => e.status === 'failed');
  
  return {
    total: emailQueue.size,
    pending: pending.length,
    sent: sent.length,
    failed: failed.length,
    items: {
      pending,
      failed,
    },
  };
}

/**
 * Clear queue (for testing)
 */
export function clearEmailQueue() {
  emailQueue.clear();
  console.log('Email queue cleared');
}
