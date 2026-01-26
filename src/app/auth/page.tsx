"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { createFirstFolderFromDemo } from '@/lib/create-first-folder';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Gift, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Globe,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/icons/app-logo';
import Link from 'next/link';

// ============================================================================
// ANIMATED PLAYER GRID STRIPS - Hero Section için Player Demo Şeritleri
// ============================================================================

// Demo video thumbnails with colorful gradients
const DEMO_PLAYERS = [
  { id: 1, color: 'from-red-500 to-orange-500', title: 'Canlı Yayın', icon: '🔴' },
  { id: 2, color: 'from-blue-500 to-cyan-500', title: 'Eğitim', icon: '📚' },
  { id: 3, color: 'from-purple-500 to-pink-500', title: 'Müzik', icon: '🎵' },
  { id: 4, color: 'from-green-500 to-emerald-500', title: 'Doğa', icon: '🌿' },
  { id: 5, color: 'from-yellow-500 to-amber-500', title: 'Podcast', icon: '🎙️' },
  { id: 6, color: 'from-indigo-500 to-violet-500', title: 'Teknoloji', icon: '💻' },
  { id: 7, color: 'from-pink-500 to-rose-500', title: 'Sanat', icon: '🎨' },
  { id: 8, color: 'from-teal-500 to-cyan-500', title: 'Spor', icon: '⚽' },
  { id: 9, color: 'from-orange-500 to-red-500', title: 'Yemek', icon: '🍳' },
  { id: 10, color: 'from-violet-500 to-purple-500', title: 'Film', icon: '🎬' },
  { id: 11, color: 'from-cyan-500 to-blue-500', title: 'Oyun', icon: '🎮' },
  { id: 12, color: 'from-emerald-500 to-green-500', title: 'Sağlık', icon: '💪' },
];

// Demo player card component - non-interactive
function DemoPlayerCard({ player, size = 'md' }: { player: typeof DEMO_PLAYERS[0]; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-24 h-14',
    md: 'w-32 h-20',
    lg: 'w-40 h-24',
  };
  
  return (
    <div 
      className={cn(
        sizeClasses[size],
        "relative rounded-xl overflow-hidden shadow-lg flex-shrink-0 pointer-events-none select-none",
        "bg-gradient-to-br",
        player.color
      )}
    >
      {/* Fake video overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        </div>
      </div>
      
      {/* Title bar */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <span className="text-xs">{player.icon}</span>
          <span className="text-[10px] text-white/90 font-medium truncate">{player.title}</span>
        </div>
      </div>
      
      {/* Live indicator for some */}
      {player.id % 3 === 1 && (
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-red-500 rounded text-[8px] text-white font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          CANLI
        </div>
      )}
    </div>
  );
}

// Animated strip of players
function AnimatedPlayerStrip({ 
  players, 
  speed = 30, 
  direction = 'left',
  size = 'md'
}: { 
  players: typeof DEMO_PLAYERS; 
  speed?: number; 
  direction?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}) {
  // Double the players for seamless loop
  const doubledPlayers = [...players, ...players];
  
  return (
    <div className="relative overflow-hidden w-full pointer-events-none">
      <motion.div
        className="flex gap-3"
        animate={{
          x: direction === 'left' ? [0, -50 * players.length] : [-50 * players.length, 0]
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: "linear",
          }
        }}
      >
        {doubledPlayers.map((player, idx) => (
          <DemoPlayerCard key={`${player.id}-${idx}`} player={player} size={size} />
        ))}
      </motion.div>
    </div>
  );
}

// Password validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(1, { message: "Şifre gereklidir." }),
});

const signupSchema = z.object({
  username: z.string().min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }),
  referralCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Kullanım şartlarını ve gizlilik politikasını kabul etmelisiniz."
  }),
  acceptMarketing: z.boolean().optional(),
});

// Password strength checker
function getPasswordStrength(password: string): { score: number; label: string; color: string; checks: { label: string; passed: boolean }[] } {
  const checks = [
    { label: "En az 6 karakter", passed: password.length >= 6 },
    { label: "Büyük harf içerir", passed: /[A-Z]/.test(password) },
    { label: "Küçük harf içerir", passed: /[a-z]/.test(password) },
    { label: "Rakam içerir", passed: /[0-9]/.test(password) },
    { label: "Özel karakter içerir", passed: /[^A-Za-z0-9]/.test(password) },
  ];
  
  const score = checks.filter(c => c.passed).length;
  
  if (score <= 2) return { score, label: "Zayıf", color: "bg-red-500", checks };
  if (score <= 3) return { score, label: "Orta", color: "bg-yellow-500", checks };
  if (score <= 4) return { score, label: "İyi", color: "bg-blue-500", checks };
  return { score, label: "Güçlü", color: "bg-green-500", checks };
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const isSignup = mode === 'signup';
  const formSchema = isSignup ? signupSchema : loginSchema;
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: isSignup ? {
      username: "",
      email: "",
      password: "",
      referralCode: "",
      acceptTerms: false,
      acceptMarketing: false,
    } : {
      email: "",
      password: "",
    },
  });
  
  const password = form.watch('password') || '';
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  
  // Check for referral code and error messages in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        setReferralCodeInput(refCode);
        form.setValue('referralCode', refCode);
      }
      
      // Handle OAuth errors from callback
      const errorCode = params.get('error');
      const errorMessage = params.get('message');
      
      if (errorCode) {
        // Clear auth cookies on any error from callback
        const cookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token'];
        cookies.forEach(name => {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        });
        console.log('🧹 Auth cookies cleared on error:', errorCode);
        
        const errorMessages: Record<string, { title: string; description: string }> = {
          'pkce_missing': {
            title: '⚠️ Oturum Süresi Doldu',
            description: 'Güvenlik doğrulaması süresi doldu. Lütfen tekrar giriş yapın.',
          },
          'session_expired': {
            title: '⏰ Oturum Süresi Doldu',
            description: errorMessage || 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
          },
          'auth_failed': {
            title: '❌ Giriş Başarısız',
            description: 'Kimlik doğrulama başarısız oldu. Lütfen tekrar deneyin.',
          },
          'exchange_failed': {
            title: '❌ Bağlantı Hatası',
            description: 'OAuth bağlantısı kurulamadı. Lütfen tekrar deneyin.',
          },
          'access_denied': {
            title: '🚫 Erişim Reddedildi',
            description: 'Google hesabı erişimi reddedildi.',
          },
        };
        
        const toastInfo = errorMessages[errorCode] || {
          title: '⚠️ Hata Oluştu',
          description: `Hata kodu: ${errorCode}`,
        };
        
        toast({
          title: toastInfo.title,
          description: toastInfo.description,
          variant: 'destructive',
        });
        
        // Clean URL without refreshing
        window.history.replaceState({}, '', '/auth');
      }
    }
  }, [form, toast]);
  
  // Reset form when mode changes
  useEffect(() => {
    form.reset(isSignup ? {
      username: "",
      email: "",
      password: "",
      referralCode: referralCodeInput,
    } : {
      email: "",
      password: "",
    });
    setIsResetSent(false);
  }, [mode, form, referralCodeInput]);
  
  const onSubmit = async (values: z.infer<typeof loginSchema> | z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const signupValues = values as z.infer<typeof signupSchema>;
        const result = await signUp(signupValues.email, signupValues.password, signupValues.username);
        
        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        // Check if user has demo data to save (from landing page)
        const demoRandomCount = localStorage.getItem('demo-random-count');
        const hasDemoData = localStorage.getItem('create-first-folder-from-demo') === 'true';
        
        // Show saving message if demo data exists
        if (hasDemoData) {
          const randomCount = demoRandomCount ? parseInt(demoRandomCount) : 0;
          toast({
            title: "🎬 Oynatıcılarınız kaydediliyor...",
            description: randomCount > 0 
              ? `Demo klasörü ve ${randomCount} rastgele klasörünüz hesabınıza aktarılıyor.`
              : "Demo içerikleriniz hesabınıza aktarılıyor.",
          });
        }
        
        // Create first folder from demo if applicable
        let folderCreated = false;
        if (userId) {
          folderCreated = await createFirstFolderFromDemo(userId);
        }
        
        // Cleanup demo storage flags
        localStorage.removeItem('demo-random-count');
        
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
        
        // Show success message with achievements info
        const successMessage = folderCreated 
          ? "Kayıt başarılı! İlk klasörünüz hazır. 🎉" 
          : "Kayıt başarılı! 🎉";
        
        toast({ 
          title: successMessage, 
          description: "E-postanızı kontrol edip doğrulayın." 
        });
        
        // Store achievements to show on next page
        if (folderCreated) {
          localStorage.setItem('pending-achievements', JSON.stringify([
            {
              id: `achievement-${Date.now()}-1`,
              title: 'Hoş Geldin!',
              description: 'Başarıyla üye oldun ve ilk adımını attın.',
              icon: 'star',
              rarity: 'rare',
              timestamp: Date.now()
            },
            {
              id: `achievement-${Date.now()}-2`,
              title: 'İlk Klasörünü Oluşturdun',
              description: 'Demo içeriğinle ilk klasörünüz hazır!',
              icon: 'folder',
              rarity: 'epic',
              timestamp: Date.now()
            }
          ]));
        } else {
          localStorage.setItem('pending-achievements', JSON.stringify([
            {
              id: `achievement-${Date.now()}`,
              title: 'Hoş Geldin!',
              description: 'Başarıyla üye oldun ve ilk adımını attın.',
              icon: 'star',
              rarity: 'rare',
              timestamp: Date.now()
            }
          ]));
        }
        
        router.push('/');
      } else {
        const loginValues = values as z.infer<typeof loginSchema>;
        try {
          await signIn(loginValues.email, loginValues.password);
          toast({ 
            title: "Giriş başarılı! 🎉", 
            description: "Hoş geldiniz!" 
          });
          
          // Small delay to ensure state updates propagate
          setTimeout(() => {
            router.push('/');
          }, 500);
        } catch (signinError: any) {
          throw signinError;
        }
      }
    } catch (error: any) {
      toast({ 
        title: "Hata", 
        description: error.message || "Bir şeyler ters gitti.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      const handleQuickDemo = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
          console.log('🚀 Quick demo mode activated');
      
          // Try to signup or login with demo credentials
          const demoEmail = 'demo@tv25.local';
          const demoPassword = 'Demo@12345';
      
          // First try to login
          try {
            const { error } = await supabase.auth.signInWithPassword({
              email: demoEmail,
              password: demoPassword,
            });
        
            if (!error) {
              console.log('✅ Demo login successful');
              setTimeout(() => {
                router.push('/');
              }, 500);
              return;
            }
          } catch (e) {
            console.log('Demo account not found, creating new one');
          }
      
          // If login fails, try to signup
          const { data, error: signupError } = await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              data: {
                username: 'DemoUser',
                full_name: 'Demo User',
              },
            },
          });
      
          if (signupError) {
            throw signupError;
          }
      
          console.log('✅ Demo account created:', demoEmail);
      
          // Auto-login with the newly created account
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });
      
          if (loginError) {
            throw loginError;
          }
      
          toast({
            title: '🎉 Demo Modu Başlatıldı',
            description: 'Hoş geldiniz! Canvas sayfasına yönlendiriliyorsunuz...',
          });
      
          setTimeout(() => {
            router.push('/');
          }, 500);
        } catch (error: any) {
          console.error('❌ Demo mode error:', error);
          toast({
            title: 'Hata',
            description: error.message || 'Demo modu etkinleştirilemedi.',
            variant: 'destructive',
          });
        } finally {
          setIsSubmitting(false);
        }
      };
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
          title: "E-posta Gönderildi ✉️",
          description: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOAuthLogin = async (provider: 'google') => {
    console.log(`🔄 [${provider}] Click detected...`);
    setError(null);
    setIsSubmitting(true);
    try {
      console.log(`🔄 [${provider}] Calling signInWithOAuth...`);
      // Log OAuth attempt
      const oauthLog = {
        provider,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
        url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      };
      localStorage.setItem('oauth_attempt_log', JSON.stringify(oauthLog));
      console.log('📝 OAuth attempt logged:', oauthLog);
      
      await signInWithOAuth(provider);
      // If we get here without an error being thrown, OAuth should redirect us
      console.log(`✅ [${provider}] signInWithOAuth succeeded (should redirect)`);
    } catch (error: any) {
      console.error(`❌ [${provider}] OAuth error caught:`, error);
      const errorMessage = error?.message || error?.error_description || `${provider} girişi başarısız oldu.`;
      const fullErrorDetails = {
        provider,
        message: errorMessage,
        code: error?.code,
        status: error?.status,
        details: error?.details,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'N/A',
        fullError: String(error)
      };
      
      console.error(`❌ [${provider}] Full error details:`, fullErrorDetails);
      
      // SAVE ERROR TO LOCALSTORAGE
      localStorage.setItem('oauth_error_log', JSON.stringify(fullErrorDetails));
      
      // SHOW ALERT WITH ERROR (won't disappear)
      window.alert(`🔴 OAuth Hatası:\n\n${errorMessage}\n\nKod: ${error?.code || 'UNKNOWN'}`);
      
      // Set error state for display
      setError(errorMessage);
      
      // Show toast
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive"
      });
      
      // FALLBACK: window.alert for visibility
      window.alert(`❌ ${provider} Hatası:\n\n${errorMessage}`);
      
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#C8D5E8]">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        {/* Header with toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="group">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 ring-2 ring-white/20 group-hover:shadow-purple-500/50 transition-shadow">
                  <AppLogo className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-slate-800">tv25</span>
                  <span className="text-[10px] text-slate-500 -mt-1">CanvasFlow</span>
                </div>
              </motion.div>
            </Link>
            
            {/* Toggle link */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setMode(isSignup ? 'login' : 'signup')}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              {isSignup ? (
                <>Zaten üye misin? <span className="text-indigo-600 font-semibold">Giriş Yap</span></>
              ) : (
                <>Hesabın yok mu? <span className="text-indigo-600 font-semibold">Üye Ol</span></>
              )}
            </motion.button>
          </div>
          
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">❌ Giriş Hatası</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  {isSignup ? 'Üye Ol' : 'Giriş Yap'}
                </h1>
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-2xl"
                >
                  ✍️
                </motion.span>
              </div>
              <p className="text-slate-500">
                {isSignup 
                  ? 'CanvasFlow ile güvenli iletişim deneyimine başla' 
                  : 'Hesabına giriş yap ve kaldığın yerden devam et.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* OAuth Buttons - Google Only */}
        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-white/60 border-white/80 hover:bg-white text-slate-700 shadow-sm"
            onClick={() => handleOAuthLogin('google')}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Devam Et
          </Button>
        </div>
        
        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-300/60" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[#C8D5E8] px-4 text-slate-500">veya e-posta ile</span>
          </div>
        </div>
        
        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FormField
                    control={form.control}
                    // @ts-expect-error username is part of signupSchema
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Kullanıcı Adı</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input 
                              placeholder="kullaniciadim" 
                              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">E-posta</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        type="email" 
                        placeholder="ornek@eposta.com" 
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Şifre</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                  
                  {/* Password Strength Indicator - Only for signup */}
                  <AnimatePresence>
                    {isSignup && password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2"
                      >
                        {/* Strength bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                              className={cn("h-full rounded-full transition-colors", passwordStrength.color)}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-medium",
                            passwordStrength.score <= 2 && "text-red-400",
                            passwordStrength.score === 3 && "text-yellow-400",
                            passwordStrength.score === 4 && "text-blue-400",
                            passwordStrength.score === 5 && "text-green-400",
                          )}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        
                        {/* Checks */}
                        <div className="grid grid-cols-2 gap-1">
                          {passwordStrength.checks.map((check, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs">
                              {check.passed ? (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              ) : (
                                <XCircle className="w-3 h-3 text-slate-500" />
                              )}
                              <span className={check.passed ? "text-green-400" : "text-slate-500"}>
                                {check.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FormItem>
              )}
            />
            
            {/* Referral Code - Only for signup */}
            <AnimatePresence>
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <FormField
                    control={form.control}
                    // @ts-expect-error referralCode is part of signupSchema
                    name="referralCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 flex items-center gap-2">
                          <Gift className="w-4 h-4 text-purple-400" />
                          Referans Kodu (Opsiyonel)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ARKADAS123" 
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500"
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-slate-500">Arkadaşından referans kodun varsa, ikiniz de ödül kazanın!</p>
                        <p className="text-xs text-slate-400 mt-1">💡 Referansınızı daha sonra da ekleyebilirsiniz.</p>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Terms and Consent Checkboxes - Only for signup */}
            <AnimatePresence>
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Terms Acceptance (Required) */}
                  <FormField
                    control={form.control}
                    // @ts-expect-error acceptTerms is part of signupSchema
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={!!field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 mt-1 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-slate-300 cursor-pointer">
                            <a href="/terms" target="_blank" className="text-indigo-400 hover:text-indigo-300 hover:underline">Kullanım Şartları</a>,{' '}
                            <a href="/privacy" target="_blank" className="text-indigo-400 hover:text-indigo-300 hover:underline">Gizlilik Politikası</a> ve{' '}
                            <a href="/kvkk" target="_blank" className="text-indigo-400 hover:text-indigo-300 hover:underline">KVKK Sözleşmesi</a>'ni okudum ve kabul ediyorum. <span className="text-red-400">*</span>
                          </FormLabel>
                          <FormMessage className="text-red-400 text-xs" />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Marketing Consent (Optional) */}
                  <FormField
                    control={form.control}
                    // @ts-expect-error acceptMarketing is part of signupSchema
                    name="acceptMarketing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={!!field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 mt-1 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-slate-300 cursor-pointer">
                            Kampanyalar, duyurular ve ürün güncellemeleri hakkında dijital mesaj almak istiyorum.
                          </FormLabel>
                          <p className="text-xs text-slate-500">İstediğiniz zaman vazgeçebilirsiniz.</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Forgot password - Only for login */}
            {!isSignup && (
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  onClick={handlePasswordReset} 
                  className="text-slate-400 hover:text-indigo-400 p-0 h-auto"
                  disabled={isResetSent}
                >
                  {isResetSent ? "✓ E-posta gönderildi" : "Şifreni mi unuttun?"}
                </Button>
              </div>
            )}
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                isSignup ? 'Üye Ol' : 'Giriş Yap'
              )}
            </Button>
          </form>
        </Form>
      </div>
      
      {/* Right Side - Animated Player Grid Demo */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
        </div>
        
        {/* Animated Player Strips - Different speeds */}
        <div className="absolute inset-0 flex flex-col justify-center gap-4 py-8 pointer-events-none select-none">
          {/* Header */}
          <div className="px-8 mb-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <Link href="/" className="block mx-auto mb-4 group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow cursor-pointer">
                  <AppLogo className="w-8 h-8 text-white" />
                </div>
              </Link>
              <h2 className="text-2xl font-bold text-white mb-2">
                Dijital Canvas&apos;ını Oluştur
              </h2>
              <p className="text-white/60 text-sm max-w-xs mx-auto">
                Video, resim, widget ve daha fazlasını kendi düzeninde organize et
              </p>
            </motion.div>
          </div>
          
          {/* Strip 1 - Slow, left direction */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatedPlayerStrip 
              players={DEMO_PLAYERS.slice(0, 6)} 
              speed={45} 
              direction="left" 
              size="md"
            />
          </motion.div>
          
          {/* Strip 2 - Medium, right direction */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <AnimatedPlayerStrip 
              players={DEMO_PLAYERS.slice(3, 9)} 
              speed={35} 
              direction="right" 
              size="lg"
            />
          </motion.div>
          
          {/* Strip 3 - Fast, left direction */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <AnimatedPlayerStrip 
              players={DEMO_PLAYERS.slice(6, 12)} 
              speed={25} 
              direction="left" 
              size="sm"
            />
          </motion.div>
          
          {/* Strip 4 - Slowest, right direction */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <AnimatedPlayerStrip 
              players={[...DEMO_PLAYERS.slice(9, 12), ...DEMO_PLAYERS.slice(0, 3)]} 
              speed={55} 
              direction="right" 
              size="md"
            />
          </motion.div>
          
          {/* Features at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="px-8 mt-6 relative z-10"
          >
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: Shield, text: "Güvenli" },
                { icon: Globe, text: "Senkron" },
                { icon: Zap, text: "AI Destekli" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full"
                >
                  <feature.icon className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-xs text-white/80 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Overlay gradient at edges for seamless scroll */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-purple-950 to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
}
