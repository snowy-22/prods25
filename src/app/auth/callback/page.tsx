'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppLogo } from '@/components/icons/app-logo';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();
        
        // Supabase automatically handles the code exchange
        // Just check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/?error=auth_failed');
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

          router.replace('/canvas');
        } else {
          router.replace('/');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        router.replace('/');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <AppLogo className="h-24 w-24 text-primary animate-pulse" />
        <p className="text-muted-foreground">Giriş yapılıyor...</p>
      </div>
    </div>
  );
}
