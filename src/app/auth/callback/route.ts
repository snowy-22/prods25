import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth provider errors
  if (errorParam) {
    const encodedError = encodeURIComponent(errorDescription || 'OAuth provider returned an error');
    return NextResponse.redirect(
      new URL(`/auth?error=${errorParam}&message=${encodedError}`, request.url)
    );
  }

  // Check if code exists
  if (!code) {
    return NextResponse.redirect(
      new URL('/auth?error=missing_code&message=Kod bulunamadı. Lütfen tekrar giriş yapın.', request.url)
    );
  }

  try {
    console.log('🔐 Server-side OAuth callback started');
    console.log(`📍 Code: ${code.substring(0, 20)}...`);

    // Create Supabase client with service role
    const supabase = createClient();

    // Exchange code for session on server-side (PKCE-safe)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ Exchange error:', {
        message: exchangeError.message,
        status: (exchangeError as any).status,
      });

      const isPkceError = exchangeError.message?.toLowerCase().includes('pkce') ||
        exchangeError.message?.toLowerCase().includes('code verifier');

      const errorCode = isPkceError ? 'session_expired' : 'exchange_failed';
      const errorMsg = isPkceError 
        ? 'Oturum süresi doldu. Lütfen tekrar giriş yapın.'
        : 'Giriş doğrulaması tamamlanamadı. Lütfen tekrar deneyin.';

      return NextResponse.redirect(
        new URL(`/auth?error=${errorCode}&message=${encodeURIComponent(errorMsg)}`, request.url)
      );
    }

    if (!data?.session) {
      console.warn('⚠️ No session returned from exchange');
      return NextResponse.redirect(
        new URL('/auth?error=no_session&message=Oturum bulunamadı.', request.url)
      );
    }

    console.log('✅ Session obtained successfully');
    console.log(`👤 User: ${data.session.user?.email}`);

    // Redirect to canvas with success
    const response = NextResponse.redirect(new URL('/canvas', request.url));

    // Set session cookies
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      response.cookies.set('sb-auth-token', session.access_token, {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
      });
    }

    return response;
  } catch (err) {
    console.error('💥 OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/auth?error=unexpected&message=Beklenmeyen hata oluştu.', request.url)
    );
  }
}
