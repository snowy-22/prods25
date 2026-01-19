'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppLogo } from '@/components/icons/app-logo';
import { Suspense } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();
        
        // Check for authorization code in URL (OAuth callback)
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        // Handle OAuth errors from provider
        if (errorParam) {
          console.error('OAuth provider error:', errorParam, errorDescription);
          // Clear auth cookies on provider error
          if (typeof document !== 'undefined') {
            const cookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token'];
            cookies.forEach(name => {
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
            });
            console.log('🧹 Auth cookies cleared on provider error');
          }
          router.replace(`/auth?error=${errorParam}`);
          return;
        }
        
        if (code) {
          console.log('🔐 OAuth code detected:', code.substring(0, 8) + '...');
          
          // Exchange code for session using PKCE
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('❌ Code exchange error:', exchangeError.message);
              
              // Clear all auth cookies on any exchange error
              const clearAuthCookies = () => {
                if (typeof document !== 'undefined') {
                  const cookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token'];
                  cookies.forEach(name => {
                    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
                  });
                  console.log('🧹 Auth cookies cleared');
                }
              };
              
              // Handle PKCE error - code verifier missing from storage
              if (exchangeError.message?.includes('PKCE') || 
                  exchangeError.message?.includes('code verifier') ||
                  exchangeError.message?.includes('both auth code and code verifier')) {
                console.warn('⚠️ PKCE verifier expired or missing. Clearing cookies and redirecting...');
                clearAuthCookies();
                await supabase.auth.signOut();
                router.replace('/auth?error=session_expired&message=Oturum süresi doldu. Lütfen tekrar giriş yapın.');
                return;
              }
              
              // Other exchange errors
              clearAuthCookies();
              await supabase.auth.signOut();
              router.replace(`/auth?error=exchange_failed`);
              return;
            }
            
            if (data?.session) {
              console.log('✅ OAuth session established:', data.session.user.email);
            }
          } catch (exchangeErr: any) {
            console.error('❌ Exchange exception:', exchangeErr);
            router.replace('/auth?error=exchange_exception');
            return;
          }
        }
        
        // Wait for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/auth?error=auth_failed');
          return;
        }

        if (session?.user) {
          // Successfully authenticated
          console.log('✅ OAuth login successful:', session.user.email);
          
          // Create profile if it doesn't exist
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              username: session.user.user_metadata?.name || 
                       session.user.user_metadata?.full_name || 
                       session.user.email?.split('@')[0] || 
                       'User',
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || null,
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          // Additional wait to ensure auth state is propagated
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('🚀 Redirecting to canvas...');
          router.replace('/canvas');
        } else {
          console.log('⚠️ No session found, redirecting to auth...');
          router.replace('/auth');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        router.replace('/auth');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <AppLogo className="h-24 w-24 text-primary animate-pulse" />
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-medium">Giriş yapılıyor...</p>
          <p className="text-sm text-muted-foreground">Lütfen bekleyin, hesabınız hazırlanıyor</p>
        </div>
        <div className="flex gap-1 mt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AppLogo className="h-24 w-24 text-primary animate-pulse" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
