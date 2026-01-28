'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Link2,
  Unlink,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Key,
  Send,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// Icons for OAuth providers
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
    <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
  </svg>
);

// Email validation schema
const emailSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
});

type EmailFormData = z.infer<typeof emailSchema>;

// Types
interface LinkedEmail {
  id: string;
  email: string;
  isPrimary: boolean;
  isVerified: boolean;
  addedAt: string;
}

interface LinkedProvider {
  id: string;
  provider: 'google' | 'apple' | 'github' | 'twitter' | 'microsoft';
  email: string;
  name: string;
  avatarUrl?: string;
  linkedAt: string;
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: GoogleIcon,
    color: 'bg-white text-gray-900',
    borderColor: 'border-white/20',
  },
  apple: {
    name: 'Apple',
    icon: AppleIcon,
    color: 'bg-black text-white',
    borderColor: 'border-white/20',
  },
  github: {
    name: 'GitHub',
    icon: GitHubIcon,
    color: 'bg-[#24292e] text-white',
    borderColor: 'border-white/20',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: TwitterIcon,
    color: 'bg-black text-white',
    borderColor: 'border-white/20',
  },
  microsoft: {
    name: 'Microsoft',
    icon: MicrosoftIcon,
    color: 'bg-[#2F2F2F] text-white',
    borderColor: 'border-white/20',
  },
};

export function AccountLinking() {
  const { user } = useAppStore();
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState<string | null>(null);

  // Mock linked emails
  const [linkedEmails, setLinkedEmails] = useState<LinkedEmail[]>([
    {
      id: 'email-1',
      email: user?.email || 'user@example.com',
      isPrimary: true,
      isVerified: true,
      addedAt: '2024-01-01',
    },
    {
      id: 'email-2',
      email: 'secondary@example.com',
      isPrimary: false,
      isVerified: true,
      addedAt: '2024-06-15',
    },
    {
      id: 'email-3',
      email: 'unverified@example.com',
      isPrimary: false,
      isVerified: false,
      addedAt: '2025-01-10',
    },
  ]);

  // Mock linked providers
  const [linkedProviders, setLinkedProviders] = useState<LinkedProvider[]>([
    {
      id: 'provider-1',
      provider: 'google',
      email: 'user@gmail.com',
      name: 'John Doe',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google',
      linkedAt: '2024-01-01',
    },
  ]);

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const handleAddEmail = async (data: EmailFormData) => {
    setIsLinking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newEmail: LinkedEmail = {
        id: `email-${Date.now()}`,
        email: data.email,
        isPrimary: false,
        isVerified: false,
        addedAt: new Date().toISOString(),
      };
      
      setLinkedEmails([...linkedEmails, newEmail]);
      setVerificationSent(data.email);
      emailForm.reset();
      setIsAddingEmail(false);
    } finally {
      setIsLinking(false);
    }
  };

  const handleRemoveEmail = async (emailId: string) => {
    setLinkedEmails(linkedEmails.filter(e => e.id !== emailId));
  };

  const handleSetPrimaryEmail = async (emailId: string) => {
    setLinkedEmails(linkedEmails.map(e => ({
      ...e,
      isPrimary: e.id === emailId,
    })));
  };

  const handleResendVerification = async (email: string) => {
    setVerificationSent(email);
    // API call would go here
    setTimeout(() => setVerificationSent(null), 5000);
  };

  const handleLinkProvider = async (provider: string) => {
    setLinkingProvider(provider);
    try {
      // OAuth flow would happen here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newProvider: LinkedProvider = {
        id: `provider-${Date.now()}`,
        provider: provider as LinkedProvider['provider'],
        email: `user@${provider}.com`,
        name: 'Connected User',
        linkedAt: new Date().toISOString(),
      };
      
      setLinkedProviders([...linkedProviders, newProvider]);
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    setLinkedProviders(linkedProviders.filter(p => p.id !== providerId));
  };

  const isProviderLinked = (provider: string) => 
    linkedProviders.some(p => p.provider === provider);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bağlı Hesaplar</h1>
        <p className="text-white/60 mt-1">Email adreslerinizi ve sosyal hesaplarınızı yönetin</p>
      </div>

      {/* Verification Alert */}
      <AnimatePresence>
        {verificationSent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Send className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-green-400 font-medium">Doğrulama emaili gönderildi!</p>
                  <p className="text-green-400/70 text-sm">{verificationSent} adresine gelen emaili kontrol edin.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVerificationSent(null)}
                  className="text-green-400 hover:text-green-300"
                >
                  Kapat
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Addresses Section */}
      <Card className="bg-white/[0.02] border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Email Adresleri</CardTitle>
                <CardDescription className="text-white/60">
                  Hesabınıza bağlı email adreslerini yönetin
                </CardDescription>
              </div>
            </div>
            <Dialog open={isAddingEmail} onOpenChange={setIsAddingEmail}>
              <DialogTrigger asChild>
                <Button className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Email Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Yeni Email Adresi Ekle</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Hesabınıza yeni bir email adresi bağlayın. Doğrulama emaili gönderilecek.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={emailForm.handleSubmit(handleAddEmail)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email Adresi</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="yeni@email.com"
                      className="bg-white/5 border-white/10 text-white"
                      {...emailForm.register('email')}
                    />
                    {emailForm.formState.errors.email && (
                      <p className="text-red-400 text-sm">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsAddingEmail(false)} className="text-white/60">
                      İptal
                    </Button>
                    <Button type="submit" className="bg-purple-500 hover:bg-purple-600" disabled={isLinking}>
                      {isLinking ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Ekleniyor...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Doğrulama Gönder
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {linkedEmails.map((emailItem) => (
            <div
              key={emailItem.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg",
                emailItem.isPrimary ? "bg-purple-500/10 border border-purple-500/30" : "bg-white/5 border border-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  emailItem.isPrimary ? "bg-purple-500/20" : "bg-white/10"
                )}>
                  <Mail className={cn(
                    "h-5 w-5",
                    emailItem.isPrimary ? "text-purple-400" : "text-white/60"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{emailItem.email}</span>
                    {emailItem.isPrimary && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        Birincil
                      </Badge>
                    )}
                    {emailItem.isVerified ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Doğrulandı
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Doğrulanmadı
                      </Badge>
                    )}
                  </div>
                  <span className="text-white/40 text-sm">Eklendi: {formatDate(emailItem.addedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!emailItem.isVerified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResendVerification(emailItem.email)}
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Tekrar Gönder
                  </Button>
                )}
                {!emailItem.isPrimary && emailItem.isVerified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetPrimaryEmail(emailItem.id)}
                    className="text-white/60 hover:text-white"
                  >
                    Birincil Yap
                  </Button>
                )}
                {!emailItem.isPrimary && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveEmail(emailItem.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Connected Accounts Section */}
      <Card className="bg-white/[0.02] border-white/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Bağlı Sosyal Hesaplar</CardTitle>
              <CardDescription className="text-white/60">
                Hızlı giriş için sosyal hesaplarınızı bağlayın
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connected Providers */}
          {linkedProviders.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white/60">Bağlı Hesaplar</h4>
              {linkedProviders.map((provider) => {
                const config = providerConfig[provider.provider];
                const Icon = config.icon;
                
                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        config.color
                      )}>
                        <Icon />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{config.name}</span>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Bağlı
                          </Badge>
                        </div>
                        <div className="text-white/40 text-sm">
                          {provider.name} • {provider.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkProvider(provider.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Unlink className="h-4 w-4 mr-1" />
                      Bağlantıyı Kaldır
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Available Providers */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white/60">Hesap Bağla</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(providerConfig).map(([providerId, config]) => {
                const isLinked = isProviderLinked(providerId);
                const isCurrentlyLinking = linkingProvider === providerId;
                const Icon = config.icon;

                if (isLinked) return null;

                return (
                  <button
                    key={providerId}
                    onClick={() => handleLinkProvider(providerId)}
                    disabled={!!linkingProvider}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg transition-all",
                      "bg-white/5 hover:bg-white/10 border border-white/10",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      config.color
                    )}>
                      {isCurrentlyLinking ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Icon />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">{config.name}</div>
                      <div className="text-white/40 text-sm">
                        {isCurrentlyLinking ? 'Bağlanıyor...' : 'Hesabı bağla'}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40" />
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="flex items-start gap-4 py-4">
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Güvenlik İpucu</h4>
            <p className="text-white/60 text-sm">
              Birden fazla giriş yöntemi ekleyerek hesabınızı daha güvenli hale getirebilirsiniz.
              Ana şifrenizi kaybetseniz bile bağlı hesaplarınız üzerinden giriş yapabilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
