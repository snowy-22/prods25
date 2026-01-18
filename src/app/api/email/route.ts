// API endpoint'i - Email Queue Status
// GET /api/email/queue - Queue durumunu kontrol et
// GET /api/email/templates - Tüm email template'lerini listele

import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail, sendPasswordResetEmail, getEmailQueueStatus, clearEmailQueue } from '@/lib/email-service';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    // Queue Status
    if (action === 'queue-status') {
      const status = getEmailQueueStatus();
      return NextResponse.json({
        success: true,
        data: status,
        message: `Queue durumu: ${status.pending} beklemede, ${status.sent} gönderilen, ${status.failed} başarısız`,
      });
    }

    // Clear Queue (Geliştirme için)
    if (action === 'clear-queue') {
      clearEmailQueue();
      return NextResponse.json({
        success: true,
        message: 'Email queue temizlendi',
      });
    }

    // List Templates
    if (action === 'templates') {
      return NextResponse.json({
        success: true,
        templates: [
          {
            id: 'welcome',
            name: 'Hoş Geldiniz Maili',
            description: 'Yeni hesap oluşturuldığında gönderilen hoş geldiniz maili',
            variables: ['userName', 'userEmail'],
          },
          {
            id: 'password-reset',
            name: 'Şifre Sıfırlama Maili',
            description: 'Şifreni unuttun linki içeren email',
            variables: ['userName', 'userEmail', 'resetLink', 'expiresIn'],
          },
          {
            id: 'account-activation',
            name: 'Hesap Aktivasyonu Maili',
            description: 'Email doğrulama linki içeren email',
            variables: ['userName', 'userEmail', 'confirmLink', 'expiresIn'],
          },
          {
            id: 'referral',
            name: 'Referral Bildirim Maili',
            description: 'Arkadaş referansı ile üye oldu bildirimi',
            variables: ['referrerName', 'referrerEmail', 'referralName', 'bonusCredit'],
          },
          {
            id: 'promotional',
            name: 'Promosyon Maili',
            description: 'Pazarlama ve promosyon mailları',
            variables: ['userEmail', 'userName', 'promoTitle', 'promoDescription', 'ctaText', 'ctaLink'],
          },
          {
            id: 'notification',
            name: 'Sistem Bildirimi Maili',
            description: 'Güvenlik, aktivite, başarı ve hatırlatma bildirimleri',
            variables: ['userEmail', 'userName', 'type', 'title', 'content', 'actionLink'],
          },
        ],
      });
    }

    // Test Email (Geliştirme için)
    if (action === 'test-send') {
      const email = searchParams.get('email') || 'test@example.com';
      const template = searchParams.get('template') || 'welcome';

      if (template === 'welcome') {
        await sendWelcomeEmail('Test User', email);
      } else if (template === 'password-reset') {
        await sendPasswordResetEmail('Test User', email, 'https://example.com/reset/token', 3600);
      }

      return NextResponse.json({
        success: true,
        message: `Test emaili ${email} adresine gönderildi (queue'de)`,
        template,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email API - Kullanılabilir actions:',
      actions: [
        { action: 'queue-status', description: 'Email queue durumunu kontrol et' },
        { action: 'templates', description: 'Tüm email template\'lerini listele' },
        { action: 'test-send?email=user@example.com&template=welcome', description: 'Test emaili gönder' },
        { action: 'clear-queue', description: 'Queue\'yu temizle (geliştirme için)' },
      ],
    });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
