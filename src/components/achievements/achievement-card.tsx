'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, Award, Medal, Crown, Gem, 
  Check, Lock, Gift, Sparkles, Zap, Target, 
  Users, Share, ShoppingBag, MessageCircle, Heart 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { AchievementCard as AchievementCardType } from '@/lib/rewards-types';

interface AchievementCardProps {
  achievement: AchievementCardType;
  onClaim?: (achievementId: string) => void;
  onClick?: (achievement: AchievementCardType) => void;
  compact?: boolean;
  showProgress?: boolean;
}

const rarityConfig = {
  common: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-300 dark:border-slate-600',
    glow: '',
    text: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-200 text-slate-700',
    label: 'Yaygın'
  },
  rare: {
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-300 dark:border-blue-700',
    glow: 'shadow-blue-200/50 dark:shadow-blue-800/30',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Nadir'
  },
  epic: {
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    border: 'border-purple-300 dark:border-purple-700',
    glow: 'shadow-purple-200/50 dark:shadow-purple-800/30',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-700',
    label: 'Epik'
  },
  legendary: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50',
    border: 'border-amber-400 dark:border-amber-600',
    glow: 'shadow-amber-200/50 dark:shadow-amber-800/30 shadow-lg',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    label: 'Efsanevi'
  }
};

const categoryIcons = {
  account: Users,
  social: Share,
  commerce: ShoppingBag,
  engagement: Heart,
  content: MessageCircle
};

function AchievementCard({ 
  achievement, 
  onClaim, 
  onClick,
  compact = false,
  showProgress = true 
}: AchievementCardProps) {
  const rarity = rarityConfig[achievement.rarity];
  const CategoryIcon = categoryIcons[achievement.category] || Target;
  
  const progressPercent = useMemo(() => {
    if (!achievement.targetValue) return 100;
    return Math.min(100, Math.round((achievement.currentProgress / achievement.targetValue) * 100));
  }, [achievement.currentProgress, achievement.targetValue]);
  
  const isCompleted = achievement.isCompleted;
  const isClaimed = achievement.isClaimed;
  const canClaim = isCompleted && !isClaimed;
  
  // Reward display
  const rewardDisplay = useMemo(() => {
    if (!achievement.rewardType) return null;
    
    switch (achievement.rewardType) {
      case 'coupon':
        return { icon: Gift, text: 'Kupon', color: 'text-green-500' };
      case 'points':
        return { icon: Star, text: `${achievement.rewardValue || 0} puan`, color: 'text-yellow-500' };
      case 'badge':
        return { icon: Medal, text: 'Rozet', color: 'text-purple-500' };
      case 'feature':
        return { icon: Zap, text: 'Özellik', color: 'text-blue-500' };
      default:
        return { icon: Gift, text: 'Ödül', color: 'text-primary' };
    }
  }, [achievement.rewardType, achievement.rewardValue]);
  
  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
          rarity.bg,
          rarity.border,
          isCompleted && !isClaimed && "ring-2 ring-green-500/50",
          isClaimed && "opacity-70"
        )}
        onClick={() => onClick?.(achievement)}
      >
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isCompleted ? "bg-green-500/20" : "bg-muted"
        )}>
          {isClaimed ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : isCompleted ? (
            <Trophy className={cn("h-5 w-5", rarity.text)} />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{achievement.title}</p>
          {showProgress && !isCompleted && (
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progressPercent} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">{progressPercent}%</span>
            </div>
          )}
        </div>
        
        {/* Claim Button */}
        {canClaim && (
          <Button 
            size="sm" 
            variant="default" 
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onClaim?.(achievement.id);
            }}
          >
            Al
          </Button>
        )}
      </motion.div>
    );
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all",
        rarity.bg,
        rarity.border,
        rarity.glow,
        isCompleted && !isClaimed && "ring-2 ring-green-500/50 ring-offset-2",
        isClaimed && "opacity-80"
      )}
      onClick={() => onClick?.(achievement)}
    >
      {/* Rarity Badge */}
      <Badge 
        className={cn(
          "absolute -top-2 -right-2 text-xs font-semibold",
          rarity.badge
        )}
      >
        {rarity.label}
      </Badge>
      
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Icon Container */}
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
          isCompleted 
            ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200/50" 
            : "bg-muted/50"
        )}>
          {achievement.iconUrl ? (
            <img src={achievement.iconUrl} alt="" className="w-8 h-8" />
          ) : isClaimed ? (
            <Check className="h-7 w-7" />
          ) : isCompleted ? (
            <Trophy className="h-7 w-7" />
          ) : (
            <Lock className="h-7 w-7 text-muted-foreground" />
          )}
        </div>
        
        {/* Title & Category */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <CategoryIcon className={cn("h-3.5 w-3.5", rarity.text)} />
            <span className={cn("text-xs font-medium uppercase tracking-wide", rarity.text)}>
              {achievement.category === 'account' && 'Hesap'}
              {achievement.category === 'social' && 'Sosyal'}
              {achievement.category === 'commerce' && 'Ticaret'}
              {achievement.category === 'engagement' && 'Etkileşim'}
              {achievement.category === 'content' && 'İçerik'}
            </span>
          </div>
          <h3 className="font-semibold text-base leading-tight">{achievement.title}</h3>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {achievement.description}
      </p>
      
      {/* Progress */}
      {showProgress && !isCompleted && achievement.targetValue && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-muted-foreground">İlerleme</span>
            <span className="text-xs font-medium">
              {achievement.currentProgress} / {achievement.targetValue}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}
      
      {/* Reward & Action */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        {/* Reward Display */}
        {rewardDisplay && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <rewardDisplay.icon className={cn("h-4 w-4", rewardDisplay.color)} />
                <span className="text-xs font-medium">{rewardDisplay.text}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tamamlandığında kazanılacak ödül</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Action Button */}
        {canClaim ? (
          <Button 
            size="sm" 
            className="gap-1.5 bg-green-500 hover:bg-green-600"
            onClick={(e) => {
              e.stopPropagation();
              onClaim?.(achievement.id);
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ödülü Al
          </Button>
        ) : isClaimed ? (
          <Badge variant="outline" className="text-green-600 border-green-300">
            <Check className="h-3 w-3 mr-1" />
            Alındı
          </Badge>
        ) : isCompleted ? (
          <Badge variant="secondary">
            <Trophy className="h-3 w-3 mr-1" />
            Tamamlandı
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            {progressPercent}% tamamlandı
          </span>
        )}
      </div>
      
      {/* Completion Date */}
      {achievement.completedAt && (
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          {new Date(achievement.completedAt).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })} tarihinde kazanıldı
        </p>
      )}
    </motion.div>
  );
}

export default memo(AchievementCard);
