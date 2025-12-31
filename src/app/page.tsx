

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogo } from '@/components/icons/app-logo';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth-dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Plus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { initialContent, ContentItem } from '@/lib/initial-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [isHydrated, setIsHydrated] = useState(false);
  const [username, setUsername] = useLocalStorage<string | null>('canvasflow_username', null);
  const { setUser, setUsername: setStoreUsername } = useAppStore();
  
  const [authAction, setAuthAction] = useState<'login' | 'signup' | null>(null);

  const registeredUsers = useMemo(() => {
      return initialContent.filter(item => item.type === 'user-profile');
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          const userUsername = session.user.user_metadata.username || session.user.email?.split('@')[0] || 'User';
          setStoreUsername(userUsername);
          setUsername(userUsername);
          router.push('/canvas');
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    
    checkSession();
  }, [isHydrated, supabase, setUser, setStoreUsername, setUsername, router]);

  useEffect(() => {
    if (isHydrated && username) {
      router.push('/canvas');
    }
  }, [username, router, isHydrated]);
  
  const handleProfileLogin = (user: ContentItem) => {
    // For demo profiles, we still use local storage
    setUsername(user.title);
    setStoreUsername(user.title);
    toast({ title: `Tekrar hoş geldin, ${user.title}!` });
  };

  const handleAnonymousSignIn = async () => {
    setUsername('Guest');
    setStoreUsername('Guest');
    toast({ title: "Misafir olarak giriş yaptınız." });
  };
  
  const handleAddNewAccount = () => {
      setAuthAction('signup');
  };

  const handleAuthSuccess = (newUsername: string) => {
    setUsername(newUsername);
    setStoreUsername(newUsername);
  };

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <AppLogo className="h-24 w-24 text-primary" />
      </div>
    );
  }

  if (username) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping opacity-20 rounded-full bg-primary blur-xl"></div>
          <AppLogo className="h-24 w-24 text-primary relative z-10" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold animate-pulse">CanvasFlow Yükleniyor</h2>
          <p className="text-muted-foreground text-sm">Lütfen bekleyin, yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-8 p-4">
        <div className="text-center">
            <AppLogo className="h-32 w-32 mx-auto drop-shadow-2xl text-primary" />
            <h1 className="text-4xl sm:text-5xl font-bold mt-4">Kim oturum açıyor?</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Devam etmek için bir profil seçin veya yeni bir hesap oluşturun.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
            {registeredUsers.map(user => (
                <Card 
                    key={user.id}
                    className="flex flex-col items-center p-4 gap-3 cursor-pointer hover:border-primary hover:shadow-lg transition-all"
                    onClick={() => handleProfileLogin(user)}
                >
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={user.itemImageUrl || `https://avatar.vercel.sh/${user.title}.png`} alt={user.title} />
                        <AvatarFallback>{user.title.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{user.title}</span>
                </Card>
            ))}
             <Card 
                className="flex flex-col items-center justify-center p-4 gap-3 cursor-pointer hover:border-primary hover:shadow-lg transition-all h-[172px] w-[140px] border-dashed"
                onClick={handleAddNewAccount}
            >
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="h-12 w-12 text-muted-foreground" />
                </div>
                <span className="font-semibold">Hesap Ekle</span>
            </Card>
        </div>

        <div className="mt-4">
            <Button variant="ghost" className="h-16" onClick={handleAnonymousSignIn}>
                <User className="mr-2 h-5 w-5" />
                Oturum Açmadan Devam Et
            </Button>
        </div>
        
         <AuthDialog 
            action={authAction}
            authData={null} // We don't have pre-filled email anymore
            setAction={setAuthAction}
            onAuthSuccess={handleAuthSuccess}
        />
    </div>
  );
}
