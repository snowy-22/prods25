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
    } : {
      email: "",
      password: "",
    },
  });
  
  const password = form.watch('password') || '';
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  
  // Check for referral code in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        setReferralCodeInput(refCode);
        form.setValue('referralCode', refCode);
      }
    }
  }, [form]);
  
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
          title: "Hesap oluşturuldu! 🎉", 
          description: "E-postanızı kontrol edip doğrulayın." 
        });
        router.push('/');
      } else {
        const loginValues = values as z.infer<typeof loginSchema>;
        await signIn(loginValues.email, loginValues.password);
        toast({ 
          title: "Giriş başarılı! 🎉", 
          description: "Hoş geldiniz!" 
        });
        router.push('/');
      }
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
          title: "E-posta Gönderildi ✉️",
          description: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOAuthLogin = async (provider: 'google' | 'github' | 'facebook' | 'apple') => {
    setIsSubmitting(true);
    try {
      await signInWithOAuth(provider);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || `${provider} girişi başarısız oldu.`,
        variant: "destructive"
      });
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
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 ring-2 ring-white/20">
                <span className="text-xl font-black text-white">25</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-800">tv25</span>
                <span className="text-[10px] text-slate-500 -mt-1">CanvasFlow</span>
              </div>
            </motion.div>
            
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
                <>Hesabın yok mu? <span className="text-indigo-600 font-semibold">Kayıt Ol</span></>
              )}
            </motion.button>
          </div>
          
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
                  {isSignup ? 'Kayıt Ol' : 'Giriş Yap'}
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
        
        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            type="button"
            variant="outline"
            className="bg-white/60 border-white/80 hover:bg-white text-slate-700 shadow-sm"
            onClick={() => handleOAuthLogin('google')}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bg-white/60 border-white/80 hover:bg-white text-slate-700 shadow-sm"
            onClick={() => handleOAuthLogin('facebook')}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bg-white/60 border-white/80 hover:bg-white text-slate-700 shadow-sm"
            onClick={() => handleOAuthLogin('github')}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </Button>
          <Button
            type="button"
            variant="outline"
            className="bg-white/60 border-white/80 hover:bg-white text-slate-700 shadow-sm"
            onClick={() => handleOAuthLogin('apple')}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.29.89 3.08.89.9 0 2.3-1.1 3.88-.95 1.1.04 2.3.55 3.02 1.56-2.52 1.58-2.08 5.19.48 6.15-.68 1.65-1.82 2.95-3.51 3.41z"/>
            </svg>
            Apple
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
                isSignup ? 'Hesap Oluştur' : 'Giriş Yap'
              )}
            </Button>
          </form>
        </Form>
        
        {/* Terms */}
        {isSignup && (
          <p className="text-xs text-slate-500 text-center mt-6">
            Kayıt olarak{' '}
            <a href="/terms" className="text-indigo-400 hover:underline">Kullanım Şartları</a>
            {' '}ve{' '}
            <a href="/privacy" className="text-indigo-400 hover:underline">Gizlilik Politikası</a>
            &apos;nı kabul etmiş olursun.
          </p>
        )}
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
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
