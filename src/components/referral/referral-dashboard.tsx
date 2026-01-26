'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Share2, Copy, Gift, Trophy, TrendingUp,
  Loader2, RefreshCw, ExternalLink, QrCode, Link as LinkIcon,
  DollarSign, UserPlus, CheckCircle, Clock, Crown, Medal,
  ChevronRight, Sparkles, ArrowUpRight, Percent, Star
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import type { UserReferrerStatus, Referral, ReferralEarning, ReferralLinkInfo, ReferrerTier } from '@/lib/rewards-types';
import * as rewardsService from '@/lib/rewards-service';

interface ReferralDashboardProps {
  userId?: string;
  className?: string;
  compact?: boolean;
}

const tierConfig: Record<string, { color: string; bg: string; icon: typeof Crown }> = {
  'Başlangıç': { color: 'text-slate-500', bg: 'bg-slate-100', icon: Star },
  'Bronz': { color: 'text-amber-600', bg: 'bg-amber-100', icon: Medal },
  'Gümüş': { color: 'text-slate-400', bg: 'bg-slate-200', icon: Medal },
  'Altın': { color: 'text-yellow-500', bg: 'bg-yellow-100', icon: Trophy },
  'Platin': { color: 'text-purple-500', bg: 'bg-purple-100', icon: Crown },
};

export default function ReferralDashboard({ 
  userId, 
  className,
  compact = false 
}: ReferralDashboardProps) {
  const { toast } = useToast();
  const user = useAppStore(state => state.user);
  const effectiveUserId = userId || user?.id;
  
  const [referrerStatus, setReferrerStatus] = useState<UserReferrerStatus | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [linkInfo, setLinkInfo] = useState<ReferralLinkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  
  // Load referral data
  const loadReferralData = useCallback(async () => {
    if (!effectiveUserId) return;
    
    setIsLoading(true);
    try {
      const [status, userReferrals, userEarnings, link] = await Promise.all([
        rewardsService.getReferrerStatus(effectiveUserId),
        rewardsService.getUserReferrals(effectiveUserId),
        rewardsService.getReferralEarnings(effectiveUserId),
        rewardsService.getReferralLinkInfo(effectiveUserId)
      ]);
      
      setReferrerStatus(status);
      setReferrals(userReferrals);
      setEarnings(userEarnings);
      setLinkInfo(link);
    } catch (error) {
      console.error('Failed to load referral data:', error);
      toast({
        title: 'Hata',
        description: 'Referans bilgileri yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, toast]);
  
  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);
  
  // Subscribe to realtime updates
  useEffect(() => {
    if (!effectiveUserId) return;
    
    const unsubscribe = rewardsService.subscribeToRewards(effectiveUserId, (event) => {
      if (event.type === 'referral_signup' || event.type === 'referral_purchase') {
        loadReferralData();
      }
    });
    
    return () => unsubscribe();
  }, [effectiveUserId, loadReferralData]);
  
  // Activate referrer status
  const handleActivate = async () => {
    if (!effectiveUserId) return;
    
    setIsActivating(true);
    try {
      await rewardsService.becomeReferrer(effectiveUserId);
      await loadReferralData();
      toast({
        title: '🎉 Referrer Oldunuz!',
        description: 'Artık arkadaşlarınızı davet edip komisyon kazanabilirsiniz.',
      });
    } catch (error) {
      console.error('Failed to activate referrer:', error);
      toast({
        title: 'Hata',
        description: 'Referrer aktivasyonu başarısız oldu.',
        variant: 'destructive'
      });
    } finally {
      setIsActivating(false);
    }
  };
  
  // Copy referral link
  const handleCopyLink = async () => {
    if (!linkInfo?.fullUrl) return;
    
    try {
      await navigator.clipboard.writeText(linkInfo.fullUrl);
      toast({
        title: 'Link Kopyalandı!',
        description: 'Referans linkiniz panoya kopyalandı.',
      });
    } catch {
      toast({
        title: 'Referans Linki',
        description: linkInfo.fullUrl,
      });
    }
  };
  
  // Copy referral code
  const handleCopyCode = async () => {
    if (!linkInfo?.code) return;
    
    try {
      await navigator.clipboard.writeText(linkInfo.code);
      toast({
        title: 'Kod Kopyalandı!',
        description: `Referans kodunuz "${linkInfo.code}" panoya kopyalandı.`,
      });
    } catch {
      toast({
        title: 'Referans Kodu',
        description: linkInfo.code,
      });
    }
  };
  
  // Share referral link
  const handleShare = async () => {
    if (!linkInfo?.fullUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bana Katıl!',
          text: `Bu linki kullanarak üye ol ve özel indirimler kazan!`,
          url: linkInfo.fullUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };
  
  // Stats
  const stats = useMemo(() => {
    const totalReferrals = referrals.length;
    const qualifiedReferrals = referrals.filter(r => r.status === 'qualified').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
    const paidEarnings = earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
    
    return { 
      totalReferrals, 
      qualifiedReferrals, 
      pendingReferrals,
      totalEarnings, 
      pendingEarnings, 
      paidEarnings 
    };
  }, [referrals, earnings]);
  
  // Tier info
  const currentTier = useMemo(() => {
    if (!referrerStatus) return tierConfig['Başlangıç'];
    return tierConfig[referrerStatus.tierName] || tierConfig['Başlangıç'];
  }, [referrerStatus]);
  
  const TierIcon = currentTier.icon;
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Not yet a referrer - show activation CTA
  if (!referrerStatus?.isReferrer) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <div className="p-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white mb-4">
          <Users className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold mb-2">Referrer Ol, Kazan!</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Arkadaşlarınızı davet edin, her satın alımlarından komisyon kazanın. 
          Üstelik davet ettikleriniz de özel indirimler kazansın!
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-sm">
          <div className="p-3 rounded-lg bg-muted text-center">
            <Gift className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-muted-foreground">Hoş Geldin İndirimi</p>
            <p className="font-bold">%15</p>
          </div>
          <div className="p-3 rounded-lg bg-muted text-center">
            <Percent className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">Komisyon Oranı</p>
            <p className="font-bold">%5-15</p>
          </div>
          <div className="p-3 rounded-lg bg-muted text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-purple-500" />
            <p className="text-xs text-muted-foreground">5 Seviye</p>
            <p className="font-bold">Tier</p>
          </div>
        </div>
        
        <Button 
          size="lg" 
          className="gap-2"
          onClick={handleActivate}
          disabled={isActivating}
        >
          {isActivating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Referrer Ol
        </Button>
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", currentTier.bg)}>
              <TierIcon className={cn("h-5 w-5", currentTier.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Referans Programı</h2>
                <Badge className={cn(currentTier.bg, currentTier.color)}>
                  {referrerStatus.tierName}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                %{referrerStatus.commissionRate} komisyon oranı
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={loadReferralData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Davetler</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalReferrals}</p>
              <p className="text-xs text-muted-foreground">
                {stats.qualifiedReferrals} onaylı
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Kazanç</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalEarnings}₺</p>
              <p className="text-xs text-muted-foreground">
                {stats.pendingEarnings}₺ beklemede
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Sıradaki Tier</span>
              </div>
              <p className="text-sm font-medium mt-1">
                {referrerStatus.totalReferrals < 5 ? 'Bronz' : 
                 referrerStatus.totalReferrals < 15 ? 'Gümüş' :
                 referrerStatus.totalReferrals < 30 ? 'Altın' :
                 referrerStatus.totalReferrals < 50 ? 'Platin' : 'Maksimum'}
              </p>
              <Progress 
                value={Math.min(100, (referrerStatus.totalReferrals / 5) * 100)} 
                className="h-1.5 mt-2" 
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Referral Link Section */}
      {linkInfo && (
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium mb-3">Davet Linkiniz</h3>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-muted">
              <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="text-sm font-mono truncate flex-1">{linkInfo.fullUrl}</code>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Linki Kopyala</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Paylaş</TooltipContent>
            </Tooltip>
            <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                  <DialogTitle>QR Kod</DialogTitle>
                  <DialogDescription>
                    Bu QR kodu taratarak arkadaşlarınız üye olabilir.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  {linkInfo.qrCodeUrl && (
                    <img 
                      src={linkInfo.qrCodeUrl} 
                      alt="Referral QR Code" 
                      className="w-48 h-48 rounded-lg"
                    />
                  )}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Referans Kodu</p>
                    <code className="text-xl font-bold font-mono">{linkInfo.code}</code>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Referans Kodu:</p>
            <Badge variant="outline" className="font-mono cursor-pointer" onClick={handleCopyCode}>
              {linkInfo.code}
              <Copy className="h-3 w-3 ml-1" />
            </Badge>
          </div>
        </div>
      )}
      
      {/* Tabs: Referrals & Earnings */}
      <Tabs defaultValue="referrals" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="referrals" className="flex-1">
            Davetlerim ({stats.totalReferrals})
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex-1">
            Kazançlarım ({earnings.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="referrals" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {referrals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserPlus className="h-10 w-10 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium mb-1">Henüz Davetiniz Yok</h3>
                  <p className="text-sm text-muted-foreground">
                    Linkinizi paylaşarak arkadaşlarınızı davet edin.
                  </p>
                </div>
              ) : (
                referrals.map((referral) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      referral.status === 'qualified' 
                        ? "bg-green-100 text-green-600" 
                        : "bg-amber-100 text-amber-600"
                    )}>
                      {referral.status === 'qualified' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">Davetli Kullanıcı</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant={referral.status === 'qualified' ? 'default' : 'secondary'}>
                        {referral.status === 'qualified' ? 'Onaylı' : 'Beklemede'}
                      </Badge>
                      {referral.totalPurchases > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {referral.totalPurchases}₺ alışveriş
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="earnings" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {earnings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium mb-1">Henüz Kazancınız Yok</h3>
                  <p className="text-sm text-muted-foreground">
                    Davetlileriniz alışveriş yaptığında komisyon kazanırsınız.
                  </p>
                </div>
              ) : (
                earnings.map((earning) => (
                  <motion.div
                    key={earning.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      earning.status === 'paid' 
                        ? "bg-green-100 text-green-600" 
                        : "bg-amber-100 text-amber-600"
                    )}>
                      <DollarSign className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {earning.type === 'signup_bonus' ? 'Kayıt Bonusu' : 'Satış Komisyonu'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(earning.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{earning.amount}₺</p>
                      <Badge variant={earning.status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                        {earning.status === 'paid' ? 'Ödendi' : 
                         earning.status === 'pending' ? 'Beklemede' : 'İptal'}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
