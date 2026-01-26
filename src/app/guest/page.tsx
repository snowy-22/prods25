"use client";
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/providers/auth-provider';

export default function GuestPage() {
  const router = useRouter();
  const { signInAnonymously } = useAuth();
  const { setUsername } = useAppStore();

  const handleGuest = async () => {
    const guestUsername = `Guest_${Date.now()}`;
    await signInAnonymously();
    setUsername(guestUsername);
    router.push('/canvas');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Misafir Girişi</h1>
        <p className="text-muted-foreground mb-6">Üye olmadan hemen deneyin. Tüm özellikler kısıtlı olabilir.</p>
        <Button size="lg" className="w-full" onClick={handleGuest}>
          Misafir Olarak Devam Et
        </Button>
        <div className="mt-6 flex justify-center gap-4">
          <Button variant="link" asChild>
            <a href="/login">Giriş Yap</a>
          </Button>
          <Button variant="link" asChild>
            <a href="/register">Üye Ol</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
