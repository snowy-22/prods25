/**
 * Referral Verification Popup
 * 
 * Shows after OAuth/external signup to:
 * 1. Display detected referral code
 * 2. Allow user to confirm or enter referral
 * 3. Remind about email verification
 * 4. Show pending rewards
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface ReferralVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  detectedReferralCode?: string;
  userId: string;
  userEmail: string;
}

export function ReferralVerificationPopup({
  isOpen,
  onClose,
  detectedReferralCode,
  userId,
  userEmail
}: ReferralVerificationPopupProps) {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState(detectedReferralCode || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'referral' | 'email-reminder' | 'rewards'>('referral');
  const [pendingRewards, setPendingRewards] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && userId) {
      checkPendingRewards();
    }
  }, [isOpen, userId]);

  const checkPendingRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userId)
        .eq('is_claimed', false);

      if (!error && data) {
        setPendingRewards(data);
      }
    } catch (error) {
      console.error('Error checking pending rewards:', error);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) {
      setStep('email-reminder');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: referralCode,
          autoFriend: true,
          autoFollow: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '🎉 Referans kodu uygulandı!',
          description: 'Arkadaşınla otomatik bağlantı kuruldu.'
        });
        await checkPendingRewards();
        setStep('email-reminder');
      } else {
        toast({
          title: 'Hata',
          description: data.error || 'Geçersiz referans kodu',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Referans kodu uygulanırken bir sorun oluştu.',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkipReferral = () => {
    setStep('email-reminder');
  };

  const handleEmailReminderContinue = () => {
    if (pendingRewards.length > 0) {
      setStep('rewards');
    } else {
      onClose();
    }
  };

  const handleClaimRewards = async () => {
    toast({
      title: '✨ Ödüller hazırlanıyor!',
      description: 'E-posta doğrulaması sonrası tüm ödüllerin kilidi açılacak.'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'referral' && (
          <>
            <DialogHeader>
              <DialogTitle>🎁 Referans Kodun Var mı?</DialogTitle>
              <DialogDescription>
                Bir arkadaşının daveti ile mi katılıyorsun? Referans kodunu gir ve özel ödüller kazan!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {detectedReferralCode && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium">✨ Referans kodu algılandı!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kod: <code className="font-mono font-bold">{detectedReferralCode}</code>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="referralCode">Referans Kodu</Label>
                <Input
                  id="referralCode"
                  placeholder="ABC123DEF456"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>✓ Referans kodu kullanarak:</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li>Arkadaşınla otomatik bağlanırsın</li>
                  <li>Her ikiniz de özel ödüller kazanırsınız</li>
                  <li>Bonus puanlar ve başarımlar kazanırsınız</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleSkipReferral}>
                Atlat
              </Button>
              <Button 
                onClick={handleApplyReferral} 
                disabled={isVerifying || !referralCode.trim()}
              >
                {isVerifying ? 'Uygulanıyor...' : 'Uygula & Devam Et'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'email-reminder' && (
          <>
            <DialogHeader>
              <DialogTitle>📧 Son Bir Adım!</DialogTitle>
              <DialogDescription>
                Hesabını aktifleştirmek ve ödülleri kazanmak için e-postanı doğrula.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  ⚠️ E-posta Doğrulaması Gerekli
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                  <strong>{userEmail}</strong> adresine bir doğrulama e-postası gönderdik.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">E-posta doğrulandığında:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Tüm platform özelliklerine erişim</li>
                  <li>Referans ödüllerinin kilidi açılır</li>
                  <li>Başarımlar ve rozetler kazanırsın</li>
                  <li>Bildirimler aktif olur</li>
                </ul>
              </div>

              {pendingRewards.length > 0 && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium">
                    🎁 {pendingRewards.length} ödül bekliyor!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    E-posta doğrulaması sonrası talepler edilebilir.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleEmailReminderContinue} className="w-full">
                {pendingRewards.length > 0 ? 'Ödülleri Gör' : 'Anladım, Devam Et'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'rewards' && (
          <>
            <DialogHeader>
              <DialogTitle>🎁 Bekleyen Ödüllerin</DialogTitle>
              <DialogDescription>
                E-posta doğrulaması sonrası bu ödüller otomatik olarak hesabına eklenecek.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
              {pendingRewards.map((reward, index) => (
                <div
                  key={reward.id}
                  className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {reward.reward_category === 'points' && '💎'}
                        {reward.reward_category === 'achievement' && '🏆'}
                        {reward.reward_category === 'badge' && '🎖️'}
                        {reward.reward_category === 'item' && '🎁'}
                        {' '}
                        {reward.reward_value.message || 'Ödül'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reward.reward_type === 'signup' && 'Kayıt Bonusu'}
                        {reward.reward_type === 'email_verified' && 'E-posta Doğrulama'}
                        {reward.reward_type === 'first_login' && 'İlk Giriş Bonusu'}
                      </p>
                    </div>
                    {reward.reward_value.points && (
                      <div className="ml-2 px-2 py-1 bg-primary/10 rounded text-xs font-bold">
                        +{reward.reward_value.points} XP
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={handleClaimRewards} className="w-full">
                Harika! E-postamı Doğrulayacağım
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
