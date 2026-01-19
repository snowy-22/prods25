'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Filter, Search, ChevronDown, 
  Loader2, RefreshCw, Sparkles, Target, Grid, List 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import AchievementCard from './achievement-card';
import type { AchievementCard as AchievementCardType } from '@/lib/rewards-types';
import * as rewardsService from '@/lib/rewards-service';

interface AchievementsFolderProps {
  userId?: string;
  onAchievementClick?: (achievement: AchievementCardType) => void;
  className?: string;
  compact?: boolean;
}

type ViewMode = 'grid' | 'list';
type CategoryFilter = 'all' | 'account' | 'social' | 'commerce' | 'engagement' | 'content';
type StatusFilter = 'all' | 'completed' | 'in-progress' | 'locked';
type RarityFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary';

export default function AchievementsFolder({ 
  userId, 
  onAchievementClick,
  className,
  compact = false 
}: AchievementsFolderProps) {
  const { toast } = useToast();
  const user = useAppStore(state => state.user);
  const effectiveUserId = userId || user?.id;
  
  const [achievements, setAchievements] = useState<AchievementCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  
  // Load achievements
  const loadAchievements = useCallback(async () => {
    if (!effectiveUserId) return;
    
    setIsLoading(true);
    try {
      const cards = await rewardsService.getAchievementCards(effectiveUserId);
      setAchievements(cards);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      toast({
        title: 'Hata',
        description: 'Başarılar yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, toast]);
  
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);
  
  // Subscribe to realtime updates
  useEffect(() => {
    if (!effectiveUserId) return;
    
    const unsubscribe = rewardsService.subscribeToRewards(effectiveUserId, (event) => {
      if (event.type === 'achievement_progress' || event.type === 'achievement_completed') {
        loadAchievements();
      }
    });
    
    return () => unsubscribe();
  }, [effectiveUserId, loadAchievements]);
  
  // Claim achievement reward
  const handleClaim = useCallback(async (achievementId: string) => {
    if (!effectiveUserId) return;
    
    setClaimingId(achievementId);
    try {
      const result = await rewardsService.claimAchievementReward(effectiveUserId, achievementId);
      
      if (result.success) {
        toast({
          title: '🎉 Ödül Alındı!',
          description: result.couponId 
            ? `Kupon kodunuz başarıyla oluşturuldu.`
            : result.points ? `${result.points} puan kazandınız!` : 'Ödülünüz başarıyla alındı!',
        });
        loadAchievements();
      } else {
        toast({
          title: 'Hata',
          description: 'Ödül alınırken bir hata oluştu.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to claim achievement:', error);
      toast({
        title: 'Hata',
        description: 'Ödül alınırken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setClaimingId(null);
    }
  }, [effectiveUserId, toast, loadAchievements]);
  
  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let filtered = [...achievements];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) || 
        (a.description && a.description.toLowerCase().includes(query))
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => {
        if (statusFilter === 'completed') return a.isCompleted;
        if (statusFilter === 'in-progress') return !a.isCompleted && a.currentProgress > 0;
        if (statusFilter === 'locked') return !a.isCompleted && a.currentProgress === 0;
        return true;
      });
    }
    
    // Rarity filter
    if (rarityFilter !== 'all') {
      filtered = filtered.filter(a => a.rarity === rarityFilter);
    }
    
    // Sort: completed & unclaimed first, then by progress, then by rarity
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    filtered.sort((a, b) => {
      // Claimable achievements first
      const aClaimable = a.isCompleted && !a.isClaimed;
      const bClaimable = b.isCompleted && !b.isClaimed;
      if (aClaimable !== bClaimable) return aClaimable ? -1 : 1;
      
      // Then by completion status
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
      
      // Then by progress percentage
      const aProgress = a.targetValue ? a.currentProgress / a.targetValue : 0;
      const bProgress = b.targetValue ? b.currentProgress / b.targetValue : 0;
      if (Math.abs(aProgress - bProgress) > 0.1) return bProgress - aProgress;
      
      // Then by rarity
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
    
    return filtered;
  }, [achievements, searchQuery, categoryFilter, statusFilter, rarityFilter]);
  
  // Stats
  const stats = useMemo(() => {
    const total = achievements.length;
    const completed = achievements.filter(a => a.isCompleted).length;
    const claimed = achievements.filter(a => a.isClaimed).length;
    const claimable = achievements.filter(a => a.isCompleted && !a.isClaimed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, claimed, claimable, progress };
  }, [achievements]);
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Başarılar</h2>
              <p className="text-sm text-muted-foreground">
                {stats.completed} / {stats.total} tamamlandı
              </p>
            </div>
          </div>
          
          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            {stats.claimable > 0 && (
              <Badge className="bg-green-500 text-white animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                {stats.claimable} ödül bekliyor
              </Badge>
            )}
            <Badge variant="outline">
              <Star className="h-3 w-3 mr-1 text-yellow-500" />
              {stats.progress}%
            </Badge>
          </div>
        </div>
        
        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Başarı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Kategori</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Kategori</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCategoryFilter('all')}>
                Tümü {categoryFilter === 'all' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('account')}>
                Hesap {categoryFilter === 'account' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('social')}>
                Sosyal {categoryFilter === 'social' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('commerce')}>
                Ticaret {categoryFilter === 'commerce' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('engagement')}>
                Etkileşim {categoryFilter === 'engagement' && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Durum</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Durum</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Tümü {statusFilter === 'all' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                Tamamlandı {statusFilter === 'completed' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('in-progress')}>
                Devam Ediyor {statusFilter === 'in-progress' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('locked')}>
                Kilitli {statusFilter === 'locked' && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Refresh */}
          <Button variant="ghost" size="icon" onClick={loadAchievements}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredAchievements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">Başarı Bulunamadı</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? 'Arama kriterlerinize uygun başarı bulunamadı.'
                  : 'Henüz hiç başarı kazanmadınız. Keşfetmeye devam edin!'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div 
                className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
                    : "flex flex-col gap-2"
                )}
                layout
              >
                {filteredAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <AchievementCard
                      achievement={achievement}
                      onClaim={handleClaim}
                      onClick={onAchievementClick}
                      compact={viewMode === 'list'}
                      showProgress={true}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
