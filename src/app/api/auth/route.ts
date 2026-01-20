/**
 * Authentication Route Handler
 * Handles user signup, signin, password reset, email confirmation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail as sendPasswordResetEmailService,
  sendAccountActivationEmail,
  queueEmail,
} from '@/lib/email-service';
import {
  sendSignupConfirmationEmail,
  notifyAdminNewSignup,
} from '@/lib/email-notifications';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name, confirmPassword } = await request.json();
    const supabase = await createClient();

    switch (action) {
      case 'signup': {
        // Input validation
        if (!email || !password || !name) {
          return NextResponse.json(
            { error: 'Email, şifre ve isim gereklidir' },
            { status: 400 }
          );
        }

        if (password.length < 8) {
          return NextResponse.json(
            { error: 'Şifre en az 8 karakterden oluşmalıdır' },
            { status: 400 }
          );
        }

        if (password !== confirmPassword) {
          return NextResponse.json(
            { error: 'Şifreler eşleşmiyor' },
            { status: 400 }
          );
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingUser) {
          return NextResponse.json(
            { error: 'Bu e-posta adresi zaten kullanılmaktadır' },
            { status: 409 }
          );
        }

        // Sign up
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              display_name: name.split(' ')[0],
            },
          },
        });

        if (signUpError) {
          return NextResponse.json(
            { error: signUpError.message },
            { status: 400 }
          );
        }

        if (!authData.user) {
          return NextResponse.json(
            { error: 'Kayıt başarısız oldu' },
            { status: 500 }
          );
        }

        // Create profile
        const profile = await supabase.from('profiles').insert({
          id: authData.user.id,
          email,
          full_name: name,
          display_name: name.split(' ')[0],
          created_at: new Date().toISOString(),
        });

        // Send signup confirmation email via new system
        await sendSignupConfirmationEmail(
          email,
          `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token_hash=${authData.session?.access_token}`,
          name.split(' ')[0]
        ).catch(err => console.error('[Auth] Signup confirmation email failed:', err));

        // Notify admin about new signup
        await notifyAdminNewSignup(email, name, new Date())
          .catch(err => console.error('[Auth] Admin notification failed:', err));

        // Send welcome email (legacy)
        try {
          await sendWelcomeEmail(name, email);
        } catch (emailError) {
          console.error('Welcome email send failed:', emailError);
          // Don't fail signup if email fails
          queueEmail(email, '🎉 CanvasFlow\'a Hoş Geldiniz!', '', 'welcome');
        }

        // Send account activation email if confirmation required
        if (authData.user.email_confirmed_at === null) {
          try {
            await sendAccountActivationEmail(
              name,
              email,
              `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token_hash=${authData.session?.access_token}`
            );
          } catch (emailError) {
            console.error('Activation email send failed:', emailError);
          }
        }

        console.log(`✅ Signup successful: ${email}`);

        return NextResponse.json({
          success: true,
          user: authData.user,
          message: 'Başarıyla kayıt oldunuz! E-postanızı kontrol edin.',
        });
      }

      case 'signin': {
        if (!email || !password) {
          return NextResponse.json(
            { error: 'Email ve şifre gereklidir' },
            { status: 400 }
          );
        }

        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          return NextResponse.json(
            { error: 'E-posta veya şifre yanlış' },
            { status: 401 }
          );
        }

        if (!authData.user) {
          return NextResponse.json(
            { error: 'Giriş başarısız oldu' },
            { status: 500 }
          );
        }

        // Get user profile for additional info
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        console.log(`✅ Sign in successful: ${email}`);

        return NextResponse.json({
          success: true,
          user: authData.user,
          profile,
          session: authData.session,
        });
      }

      case 'password-reset': {
        if (!email) {
          return NextResponse.json(
            { error: 'Email gereklidir' },
            { status: 400 }
          );
        }

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('email', email)
          .maybeSingle();

        if (!existingUser) {
          // Don't reveal if email exists (security best practice)
          return NextResponse.json({
            success: true,
            message: 'E-postanız var ise şifre sıfırlama bağlantısı gönderildi',
          });
        }

        // Send reset link
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
        });

        if (resetError) {
          console.error('Password reset error:', resetError);
          return NextResponse.json(
            { error: 'Şifre sıfırlama başarısız oldu' },
            { status: 500 }
          );
        }

        // Send email (optional - Supabase already sends one)
        try {
          await sendPasswordResetEmailService(
            email,
            `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
            email || 'Kullanıcı'
          );
        } catch (emailError) {
          console.error('Password reset email send failed:', emailError);
        }

        console.log(`✅ Password reset link sent: ${email}`);

        return NextResponse.json({
          success: true,
          message: 'E-postanız var ise şifre sıfırlama bağlantısı gönderildi',
        });
      }

      case 'confirm-email': {
        if (!email) {
          return NextResponse.json(
            { error: 'Email gereklidir' },
            { status: 400 }
          );
        }

        // Resend confirmation email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
        });

        if (resendError) {
          return NextResponse.json(
            { error: 'E-posta gönderme başarısız oldu' },
            { status: 500 }
          );
        }

        console.log(`✅ Confirmation email resent: ${email}`);

        return NextResponse.json({
          success: true,
          message: 'Doğrulama e-postası gönderildi',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Geçersiz işlem' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  if (!token || !type) {
    return NextResponse.json(
      { error: 'Token ve type gereklidir' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log(`✅ Email verified: ${data.user?.email}`);

    return NextResponse.json({
      success: true,
      user: data.user,
      message: 'E-posta başarıyla doğrulandı',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Doğrulama başarısız oldu' },
      { status: 500 }
    );
  }
}
