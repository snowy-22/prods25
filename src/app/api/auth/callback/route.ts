import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth Error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }

  // No code, redirect to auth
  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(
      new URL('/auth?error=no_code', requestUrl.origin)
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Session exchange error:', exchangeError);
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    // Success! Redirect to canvas
    const response = NextResponse.redirect(new URL('/canvas', requestUrl.origin));

    // Set secure cookies with session
    if (data.session) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      response.cookies.set('sb-refresh-token', data.session.refresh_token || '', {
        path: '/',
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(
      new URL('/auth?error=callback_error', requestUrl.origin)
    );
  }
}
