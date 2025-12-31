

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

const loginSchema = z.object({
    username: z.string().optional(),
    email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
    password: z.string().min(1, { message: "Şifre gereklidir." }),
});

const signupSchema = z.object({
  username: z.string().min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }),
});


type AuthDialogProps = {
  action: 'login' | 'signup' | null;
  authData: { email: string; isRegistered?: boolean } | null;
  setAction: (action: 'login' | 'signup' | null) => void;
  onAuthSuccess: (username: string) => void;
};

export function AuthDialog({ action, authData, setAction, onAuthSuccess }: AuthDialogProps) {
  const { toast } = useToast();
  const [isResetSent, setIsResetSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const isSignup = action === 'signup';
  const formSchema = isSignup ? signupSchema : loginSchema;
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: authData?.email || "",
      password: "",
    },
  });
  
  useEffect(() => {
    form.reset({
        username: "",
        email: authData?.email || "",
        password: ""
    });
    setIsResetSent(false);
  }, [action, authData, form]);


  const onSubmit = async (values: z.infer<typeof loginSchema> | z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const signupValues = values as z.infer<typeof signupSchema>;
        const { data, error } = await supabase.auth.signUp({
          email: signupValues.email,
          password: signupValues.password,
          options: {
            data: {
              username: signupValues.username,
            },
          },
        });

        if (error) throw error;

        toast({ title: "Hesap oluşturuldu!", description: "Lütfen e-postanızı doğrulayın." });
        onAuthSuccess(signupValues.username);
      } else {
        const loginValues = values as z.infer<typeof loginSchema>;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginValues.email,
          password: loginValues.password,
        });

        if (error) throw error;

        const username = data.user?.user_metadata?.username || data.user?.email?.split('@')[0] || 'User';
        toast({ title: "Giriş başarılı!", description: `Hoş geldin, ${username}` });
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
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      setIsResetSent(true);
      toast({
          title: "Şifre Sıfırlama E-postası Gönderildi",
          description: "Lütfen e-posta kutunuzu kontrol edin.",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setAction(null);
      form.reset();
      setIsResetSent(false);
    }
  }
  
  return (
    <Dialog open={!!action} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignup ? 'Yeni Hesap Oluştur' : 'Giriş Yap'}</DialogTitle>
          <DialogDescription>
            {isSignup ? 'CanvasFlow dünyasına katılın.' : 'Hesabınıza erişmek için giriş yapın.'}
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
                        : isSignup ? 'Hesap Oluştur' : 'Giriş Yap'
                    }
                  </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
