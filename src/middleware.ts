import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - this is Supabase recommended pattern
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optional: Protect routes - but allow guest-canvas for unauthenticated users
  if (!user && req.nextUrl.pathname.startsWith('/canvas') && !req.nextUrl.pathname.startsWith('/guest-canvas')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/',
    '/auth/callback',
    '/canvas/:path*',
    '/guest-canvas',
    '/login',
    '/register',
    '/guest',
  ],
};
