'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Ticket, Users, Gift, Star, TrendingUp,
  Loader2, ChevronRight, Sparkles, Crown, Medal,
  Percent, ShoppingBag, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';

// Component imports
import AchievementsFolder from '@/components/achievements/achievements-folder';
import CouponsSection from '@/components/coupons/coupons-section';
import ReferralDashboard from '@/components/referral/referral-dashboard';

import type { ProfileRewardsSummary } from '@/lib/rewards-types';
import * as rewardsService from '@/lib/rewards-service';

interface RewardsDashboardProps {
  userId?: string;
  className?: string;
  defaultTab?: 'overview' | 'achievements' | 'coupons' | 'referral';
  compact?: boolean;
}

export default function RewardsDashboard({ 
  userId, 
  className,
  defaultTab = 'overview',
  compact = false 
}: RewardsDashboardProps) {
  const { toast } = useToast();
  const user = useAppStore(state => state.user);
  const effectiveUserId = userId || user?.id;
  
  const [summary, setSummary] = useState<ProfileRewardsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Load summary
  const loadSummary = useCallback(async () => {
    if (!effectiveUserId) return;
    
    setIsLoading(true);
    try {
      const data = await rewardsService.getProfileRewardsSummary(effectiveUserId);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load rewards summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);
  
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);
  
  // Subscribe to realtime updates
  useEffect(() => {
    if (!effectiveUserId) return;
    
    const unsubscribe = rewardsService.subscribeToRewards(effectiveUserId, () => {
      loadSummary();
    });
    
    return () => unsubscribe();
  }, [effectiveUserId, loadSummary]);
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-4">
          <TabsTrigger value="overview" className="gap-1.5">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Özet</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Başarılar</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Kuponlar</span>
          </TabsTrigger>
          <TabsTrigger value="referral" className="gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Referans</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Points Card */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Toplam Puanım</p>
                      <p className="text-3xl font-bold text-amber-600">{summary?.points.balance || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {summary?.points.lifetimeEarned || 0} kazanıldı • {summary?.points.lifetimeSpent || 0} harcandı
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                      <Star className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Achievements Stats */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => setActiveTab('achievements')}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                          <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Başarılar</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold">{summary?.achievements.completed || 0}</span>
                            <span className="text-sm text-muted-foreground">/ {summary?.achievements.total || 0}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Progress 
                        value={(summary?.achievements.total || 0) > 0 
                          ? ((summary?.achievements.completed || 0) / (summary?.achievements.total || 1)) * 100 
                          : 0} 
                        className="h-1.5 mt-3" 
                      />
                      {(summary?.achievements.claimable || 0) > 0 && (
                        <Badge className="mt-2 bg-green-500">
                          {summary?.achievements.claimable} ödül bekliyor
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
                
                {/* Coupons Stats */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => setActiveTab('coupons')}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                          <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Kuponlar</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold">{summary?.coupons.active || 0}</span>
                            <span className="text-sm text-muted-foreground">aktif</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          {summary?.coupons.total || 0} toplam
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {summary?.coupons.totalSavings || 0}₺ tasarruf
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              
              {/* Referral Stats */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="cursor-pointer"
                onClick={() => setActiveTab('referral')}
              >
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Referans Programı</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">{summary?.referrals.totalReferrals || 0}</span>
                            <span className="text-sm text-muted-foreground">davet</span>
                            {summary?.referrals.isReferrer && (
                              <Badge className="ml-2">
                                {summary?.referrals.tierName || 'Başlangıç'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Kazanç</p>
                        <p className="text-xl font-bold text-green-600">
                          {summary?.referrals.totalEarnings || 0}₺
                        </p>
                      </div>
                    </div>
                    
                    {!summary?.referrals.isReferrer && (
                      <div className="mt-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
                        <p className="text-sm text-center">
                          <Sparkles className="h-4 w-4 inline mr-1 text-yellow-500" />
                          Referrer ol, arkadaşlarını davet et, komisyon kazan!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Son Aktiviteler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Placeholder for recent activities */}
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="p-1.5 rounded-full bg-green-100">
                        <Gift className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Hoş Geldin Kuponu</p>
                        <p className="text-xs text-muted-foreground">Yeni üye indirimi kazandınız</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Yeni</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="p-1.5 rounded-full bg-purple-100">
                        <Trophy className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">İlk Adım</p>
                        <p className="text-xs text-muted-foreground">Hesap oluşturma başarısı</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">+50 puan</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Achievements Tab */}
        <TabsContent value="achievements" className="flex-1 mt-0">
          <AchievementsFolder 
            userId={effectiveUserId} 
            className="h-full"
          />
        </TabsContent>
        
        {/* Coupons Tab */}
        <TabsContent value="coupons" className="flex-1 mt-0">
          <CouponsSection 
            userId={effectiveUserId} 
            className="h-full"
            showHeader={true}
          />
        </TabsContent>
        
        {/* Referral Tab */}
        <TabsContent value="referral" className="flex-1 mt-0">
          <ReferralDashboard 
            userId={effectiveUserId} 
            className="h-full"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
