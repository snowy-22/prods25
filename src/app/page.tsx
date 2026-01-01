'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogo } from '@/components/icons/app-logo';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth-dialog';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useAppStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, signInAnonymously } = useAuth();
  const { setUsername } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [authAction, setAuthAction] = useState<'login' | 'signup' | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || loading) return;
    
    // If user is authenticated, redirect to canvas
    if (user) {
      router.push('/canvas');
    }
  }, [user, loading, isHydrated, router]);

  const handleLoginClick = () => {
    setAuthAction('login');
  };

  const handleSignupClick = () => {
    setAuthAction('signup');
  };

  const handleAnonymousSignIn = async () => {
    const guestUsername = `Guest_${Date.now()}`;
    await signInAnonymously();
    setUsername(guestUsername);
    toast({ title: "Misafir olarak giriş yaptınız." });
    router.push('/canvas');
  };

  const handleAuthSuccess = (newUsername: string) => {
    toast({ title: "Giriş başarılı!", description: `Hoş geldin, ${newUsername}` });
    router.push('/canvas');
  };

  if (!isHydrated || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping opacity-20 rounded-full bg-primary blur-xl"></div>
            <AppLogo className="h-24 w-24 text-primary relative z-10" />
          </div>
          <p className="text-muted-foreground animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // User redirect happens in useEffect, no need for additional check

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-8 p-4">
        <div className="text-center space-y-4">
            <AppLogo className="h-32 w-32 mx-auto drop-shadow-2xl text-primary" />
            <h1 className="text-4xl sm:text-5xl font-bold">tv25.app'e Hoş Geldiniz</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Sınırsız bir kanvas üzerinde fikirlerinizi hayata geçirin
            </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button 
              size="lg" 
              className="w-48 h-12"
              onClick={handleLoginClick}
            >
              Giriş Yap
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="w-48 h-12"
              onClick={handleSignupClick}
            >
              Hesap Oluştur
            </Button>
        </div>

        <div className="mt-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleAnonymousSignIn}
            >
                <User className="mr-2 h-4 w-4" />
                Misafir Olarak Devam Et
            </Button>
        </div>
        
         <AuthDialog 
            action={authAction}
            authData={null}
            setAction={setAuthAction}
            onAuthSuccess={handleAuthSuccess}
        />
    </div>
  );
}
