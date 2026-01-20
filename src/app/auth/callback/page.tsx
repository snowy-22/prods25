import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  const code = params.code;
  const errorParam = params.error;
  const errorDescription = params.error_description;

  // Handle OAuth errors from provider
  if (errorParam) {
    redirect(`/auth?error=${errorParam}&message=${encodeURIComponent(errorDescription || 'OAuth provider returned an error')}`);
  }

  if (code) {
    const supabase = await createClient();
    
    // Exchange code for session using PKCE (server-side handles cookies properly)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      // Handle PKCE error - code verifier missing from storage
      if (exchangeError.message?.includes('PKCE') || 
          exchangeError.message?.includes('code verifier') ||
          exchangeError.message?.includes('both auth code and code verifier')) {
        redirect('/auth?error=session_expired&message=Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      }
      
      // Other exchange errors
      redirect('/auth?error=exchange_failed');
    }
    
    if (data?.session) {
      // Create profile if it doesn't exist
      await supabase
        .from('profiles')
        .upsert({
          id: data.session.user.id,
          username: data.session.user.user_metadata?.name || 
                   data.session.user.user_metadata?.full_name || 
                   data.session.user.email?.split('@')[0] || 
                   'User',
          email: data.session.user.email,
          full_name: data.session.user.user_metadata?.full_name || 
                    data.session.user.user_metadata?.name || null,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      redirect('/canvas');
    }
  }

  // No code or session, redirect to auth
  redirect('/auth');
}
