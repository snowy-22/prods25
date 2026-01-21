'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<'exchanging' | 'error' | 'success'>('exchanging');
  const [message, setMessage] = useState('Oturum doğrulanıyor...');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Provider error returned in query string
    if (errorParam) {
      router.replace(`/auth?error=${errorParam}&message=${encodeURIComponent(errorDescription || 'OAuth provider returned an error')}`);
      return;
    }

    if (!code) {
      router.replace('/auth?error=missing_code&message=Kod bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    const exchange = async () => {
      try {
        console.log('📋 OAuth Callback Handler Started');
        console.log(`🔗 Current URL: ${window.location.href}`);
        console.log(`🌍 Origin: ${window.location.origin}`);
        console.log(`🔐 Code parameter exists: ${!!code}`);

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('❌ Exchange error details:', {
            message: exchangeError.message,
            status: (exchangeError as any).status,
            statusCode: (exchangeError as any).statusCode,
            cause: (exchangeError as any).cause,
          });

          const isPkceError = exchangeError.message?.includes('PKCE') ||
            exchangeError.message?.includes('code verifier') ||
            exchangeError.message?.includes('both auth code and code verifier');

          const errorQuery = isPkceError
            ? `session_expired&message=${encodeURIComponent('Oturum süresi doldu. Lütfen tekrar giriş yapın.')}`
            : `exchange_failed&message=${encodeURIComponent('Giriş doğrulaması tamamlanamadı. Lütfen tekrar deneyin.')}`;

          setStatus('error');
          setMessage('Giriş doğrulaması başarısız. Yönlendiriliyorsunuz...');
          router.replace(`/auth?error=${errorQuery}`);
          return;
        }

        if (data?.session) {
          console.log('✅ Session obtained successfully');
          console.log('👤 User:', data.session.user?.email);
          setStatus('success');
          setMessage('Başarılı! Yönlendiriliyorsunuz...');
          router.replace('/canvas');
          return;
        }

        console.warn('⚠️ No session data returned');
        setStatus('error');
        setMessage('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        router.replace(`/auth?error=no_session&message=${encodeURIComponent('Oturum bulunamadı.')}`);
      } catch (err) {
        console.error('💥 OAuth callback error:', err);
        console.error('Error details:', {
          name: (err as any)?.name,
          message: (err as any)?.message,
          stack: (err as any)?.stack,
        });
        setStatus('error');
        setMessage('Beklenmeyen hata oluştu. Lütfen tekrar deneyin.');
        router.replace('/auth?error=unexpected');
      }
    };

    exchange();
  }, [router, searchParams, supabase]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className={`h-12 w-12 rounded-full border-2 ${status === 'error' ? 'border-destructive' : 'border-primary'} border-b-transparent animate-spin`} />
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">Bu pencere otomatik olarak yönlendirilecek.</p>
      </div>
    </div>
  );
}
