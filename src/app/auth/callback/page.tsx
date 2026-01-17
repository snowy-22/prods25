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
        
        if (code) {
          console.log('🔐 OAuth code detected:', code.substring(0, 8) + '...');
          
          // Try to exchange the code if method exists (newer Supabase versions)
          if (supabase.auth.exchangeCodeForSession) {
            console.log('Using exchangeCodeForSession method...');
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('❌ Code exchange error:', exchangeError);
              // Don't return, try to get session anyway
            } else if (data?.session) {
              console.log('✅ OAuth session established:', data.session.user.email);
            }
          } else {
            console.log('⚠️ exchangeCodeForSession not available, relying on Supabase auto-handling');
          }
        }
        
        // Wait a moment for Supabase to process the code
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the session (either from exchange or existing)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/auth?error=auth_failed');
          return;
        }

        if (session?.user) {
          // Successfully authenticated
          console.log('OAuth login successful:', session.user.email);
          
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

          router.replace('/');
        } else {
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
        <p className="text-muted-foreground">Giriş yapılıyor...</p>
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
