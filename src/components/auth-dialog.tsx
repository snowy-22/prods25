'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

const loginSchema = z.object({
    username: z.string().optional(),
    email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
    password: z.string().min(1, { message: "Şifre gereklidir." }),
});

const signupSchema = z.object({
  username: z.string().min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }),
  referralCode: z.string().optional(),
});


type AuthDialogProps = {
  action: 'login' | 'signup' | null;
  authData: { email: string; isRegistered?: boolean } | null;
  setAction: (action: 'login' | 'signup' | null) => void;
  onAuthSuccess: (username: string) => void;
};

export function AuthDialog({ action, authData, setAction, onAuthSuccess }: AuthDialogProps) {
  const { toast } = useToast();
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const router = useRouter();
  const { setUser, setUsername, setTabs } = useAppStore();
  const [isResetSent, setIsResetSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const supabase = createClient();

  const isSignup = action === 'signup';
  const formSchema = isSignup ? signupSchema : loginSchema;
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: isSignup ? {
      username: "",
      email: authData?.email || "",
      password: "",
      referralCode: "",
    } : {
      email: authData?.email || "",
      password: "",
    },
  });
  
  useEffect(() => {
    // Check for referral code in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
  // Dialog import removed for inline rendering
    }
    
    form.reset({
        username: "",
        email: authData?.email || "",
        password: "",
        referralCode: referralCodeInput
    });
    setIsResetSent(false);
  }, [action, authData, form, referralCodeInput]);
  
  const onSubmit = async (values: z.infer<typeof loginSchema> | z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const signupValues = values as z.infer<typeof signupSchema>;
        await signUp(signupValues.email, signupValues.password, signupValues.username);
        // Apply referral code if provided
        if (signupValues.referralCode) {
          try {
            const response = await fetch('/api/referral/apply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                code: signupValues.referralCode,
                autoFriend: true,
              })
            });
            if (response.ok) {
              toast({ 
                title: "Referans kodu uygulandı!", 
                description: "Ödülleriniz hesap doğrulaması sonrası verilecek." 
              });
            }
          } catch (error) {
            console.error('Referral code application error:', error);
          }
        }
        toast({ 
          title: "Kayıt başarılı!", 
          description: "E-postanızı kontrol edip doğrulayın." 
        });
        onAuthSuccess(signupValues.username);
      } else {
        const loginValues = values as z.infer<typeof loginSchema>;
        await signIn(loginValues.email, loginValues.password);
        // Username will be set by auth provider
        const username = loginValues.username || loginValues.email.split('@')[0];
        toast({ 
          title: "Giriş başarılı!", 
          description: `Hoş geldin!` 
        });
        onAuthSuccess(username);
      }
      setAction(null);
      form.reset();
    } catch (error: any) {
      toast({ 
        title: "Hata", 
        description: error.message || "Bir şeyler ters gitti.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordReset = async () => {
    const email = form.getValues('email');
    if (!email) {
      toast({ title: "Hata", description: "Lütfen e-posta adresinizi girin.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        toast({ title: "Hata", description: error.message, variant: "destructive" });
      } else {
        setIsResetSent(true);
        toast({
            title: "Şifre Sıfırlama E-postası Gönderildi",
            description: "Lütfen e-posta kutunuzu kontrol edin.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setAction(null);
      form.reset();
      setIsResetSent(false);
    }
  }

  const handleOAuthLogin = async (provider: 'google') => {
    setIsSubmitting(true);
    try {
      await signInWithOAuth(provider);
      // User will be redirected to OAuth provider
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || `${provider} girişi başarısız oldu.`,
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  }


  
  return (
    <Dialog open={!!action} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignup ? 'Yeni Kayıt' : 'Giriş Yap'}</DialogTitle>
          <DialogDescription>
            {isSignup ? 'tv25.app dünyasına katılın.' : 'tv25.app hesabınıza erişmek için giriş yapın.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            {isSignup && (
                 <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Kullanıcı Adı</FormLabel>
                        <FormControl>
              
            
            <Input placeholder="kullaniciadim" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
             <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="ornek@eposta.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center w-full pt-2">
              {!isSignup ? (
                 <Button type="button" variant="link" size="sm" onClick={handlePasswordReset} className="p-0 h-auto self-start" disabled={isResetSent}>
                    {isResetSent ? "E-posta gönderildi" : "Şifrenizi mi unuttunuz?"}
                </Button>
              ) : <div />}
              <div className="flex justify-end gap-2">
                   <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>İptal</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? 'İşleniyor...' 
                        : isSignup ? 'Kayıt Ol' : 'Giriş Yap'
                    }
                  </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>

        {/* OAuth Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">veya</span>
          </div>
        </div>

        {/* OAuth Buttons - Google Only */}
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthLogin('google')}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Giriş
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
