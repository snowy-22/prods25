import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/canvas';

  // Determine the origin for redirects
  const origin = requestUrl.origin;

  // Handle OAuth provider errors
  if (errorParam) {
    const encodedError = encodeURIComponent(errorDescription || 'OAuth provider returned an error');
    return NextResponse.redirect(
      new URL(`/auth?error=${errorParam}&message=${encodedError}`, origin)
    );
  }

  // Check if code exists
  if (!code) {
    return NextResponse.redirect(
      new URL('/auth?error=missing_code&message=Kod bulunamadı. Lütfen tekrar giriş yapın.', origin)
    );
  }

  try {
    console.log('🔐 Server-side OAuth callback started');
    console.log(`📍 Code: ${code.substring(0, 20)}...`);
    console.log(`🌍 Origin: ${origin}`);

    // Create Supabase client (async function - must await)
    const supabase = await createClient();

    // Exchange code for session on server-side (PKCE-safe)
    // The middleware handles cookie sync for PKCE code_verifier
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ Exchange error:', {
        message: exchangeError.message,
        status: (exchangeError as any).status,
        code: (exchangeError as any).code,
      });

      // Check for specific error types
      const errorMessage = exchangeError.message?.toLowerCase() || '';
      const isPkceError = errorMessage.includes('pkce') || 
                          errorMessage.includes('code verifier') ||
                          errorMessage.includes('code_verifier');
      const isExpiredError = errorMessage.includes('expired') || 
                             errorMessage.includes('invalid') ||
                             (exchangeError as any).status === 401;

      let errorCode = 'exchange_failed';
      let errorMsg = 'Giriş doğrulaması tamamlanamadı. Lütfen tekrar deneyin.';

      if (isPkceError) {
        errorCode = 'pkce_error';
        errorMsg = 'Güvenlik doğrulaması başarısız. Lütfen çerezleri temizleyip tekrar deneyin.';
      } else if (isExpiredError) {
        errorCode = 'code_expired';
        errorMsg = 'Giriş kodu süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.';
      }

      return NextResponse.redirect(
        new URL(`/auth?error=${errorCode}&message=${encodeURIComponent(errorMsg)}`, origin)
      );
    }

    if (!data?.session) {
      console.warn('⚠️ No session returned from exchange');
      return NextResponse.redirect(
        new URL('/auth?error=no_session&message=Oturum oluşturulamadı.', origin)
      );
    }

    console.log('✅ Session obtained successfully');
    console.log(`👤 User: ${data.session.user?.email}`);

    // Redirect to the next page (default: /canvas)
    // The session cookies are automatically set by Supabase SSR
    const redirectUrl = new URL(next, origin);
    
    // Avoid redirect loops
    if (redirectUrl.pathname === '/auth/callback') {
      redirectUrl.pathname = '/canvas';
    }

    console.log(`🚀 Redirecting to: ${redirectUrl.pathname}`);
    return NextResponse.redirect(redirectUrl);

  } catch (err) {
    console.error('💥 OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/auth?error=unexpected&message=Beklenmeyen bir hata oluştu.', origin)
    );
  }
}
