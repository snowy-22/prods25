'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppLogo } from '@/components/icons/app-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check if user came from password reset link
    const verifyResetLink = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (token && type === 'recovery') {
        setIsValid(true);
      } else {
        // Check if there's an active session from the reset link
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValid(true);
        } else {
          toast({
            title: "Hata",
            description: "Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.",
            variant: "destructive"
          });
          setTimeout(() => router.push('/'), 3000);
        }
      }
    };

    verifyResetLink();
  }, [searchParams, supabase, router, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Hata",
        description: "Şifreler eşleşmiyor.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Başarılı!",
          description: "Şifreniz başarıyla sıfırlanmıştır. Giriş sayfasına yönlendiriliyorsunuz..."
        });
        
        // Sign out and redirect to login
        await supabase.auth.signOut();
        setTimeout(() => router.push('/'), 2000);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Bir şeyler ters gitti.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValid) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AppLogo className="h-24 w-24 text-primary animate-pulse" />
          <p className="text-muted-foreground">Doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <AppLogo className="h-24 w-24 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Şifrenizi Sıfırlayın</h1>
          <p className="text-muted-foreground">Yeni bir şifre belirleyin</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Yeni Şifre</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Şifre Onayı</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'İşleniyor...' : 'Şifre Sıfırla'}
          </Button>
        </form>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => router.push('/')}
            disabled={isLoading}
          >
            Giriş sayfasına geri dön
          </Button>
        </div>
      </div>
    </div>
  );
}
