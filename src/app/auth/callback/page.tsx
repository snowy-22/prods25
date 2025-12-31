'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppLogo } from '@/components/icons/app-logo';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?error=auth_failed');
          return;
        }

        if (session) {
          // Successfully authenticated
          router.push('/canvas');
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <AppLogo className="h-24 w-24 text-primary animate-pulse" />
        <p className="text-muted-foreground">Giriş yapılıyor...</p>
      </div>
    </div>
  );
}
