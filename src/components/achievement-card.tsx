/**
 * Achievement Card Component
 * Ödül kartı - referans kaynağı ile
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Settings, Gift, User, Building2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import type { UserAchievement, AchievementDefinition } from '@/lib/achievements-types';
import { achievementService } from '@/lib/achievements-service';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AchievementCardProps {
  achievement: UserAchievement & { achievement?: AchievementDefinition };
  variant?: 'default' | 'compact' | 'minimal';
  showSettings?: boolean;
  onSettingsChange?: (settings: { show_referrer?: boolean; show_organization?: boolean }) => void;
}

export function AchievementCard({
  achievement,
  variant = 'default',
  showSettings = true,
  onSettingsChange,
}: AchievementCardProps) {
  const [showReferrer, setShowReferrer] = React.useState(achievement.show_referrer);
  const [showOrganization, setShowOrganization] = React.useState(achievement.show_organization);
  const [claiming, setClaiming] = React.useState(false);

  const definition = achievement.achievement;
  const hasReferrer = !!achievement.referrer_id;
  const hasOrganization = !!achievement.organization_id;

  const handleToggleReferrer = async () => {
    const newValue = !showReferrer;
    setShowReferrer(newValue);
    await achievementService.updateAchievementSettings(achievement.id, {
      show_referrer: newValue,
    });
    onSettingsChange?.({ show_referrer: newValue });
  };

  const handleToggleOrganization = async () => {
    const newValue = !showOrganization;
    setShowOrganization(newValue);
    await achievementService.updateAchievementSettings(achievement.id, {
      show_organization: newValue,
    });
    onSettingsChange?.({ show_organization: newValue });
  };

  const handleClaimReward = async () => {
    if (achievement.reward_claimed) return;
    setClaiming(true);
    const success = await achievementService.claimReward(achievement.id);
    if (success) {
      // Trigger reward animation
      console.log('Reward claimed!');
    }
    setClaiming(false);
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
        <div className="text-2xl">{definition?.icon || '🏆'}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{definition?.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {new Date(achievement.earned_at).toLocaleDateString('tr-TR')}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{definition?.icon || '🏆'}</div>
              <div>
                <CardTitle className="text-lg">{definition?.title}</CardTitle>
                <CardDescription className="text-xs">
                  {new Date(achievement.earned_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardDescription>
              </div>
            </div>
            {showSettings && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ödül Kartı Ayarları</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hasReferrer && (
                    <DropdownMenuCheckboxItem
                      checked={showReferrer}
                      onCheckedChange={handleToggleReferrer}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Referansı Göster
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasOrganization && (
                    <DropdownMenuCheckboxItem
                      checked={showOrganization}
                      onCheckedChange={handleToggleOrganization}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Organizasyonu Göster
                    </DropdownMenuCheckboxItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        {/* Referrer Info */}
        {hasReferrer && showReferrer && achievement.referrer_username && (
          <CardContent className="pt-0 pb-3">
            <Link
              href={`/${achievement.referrer_username}`}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors group"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={achievement.referrer_avatar_url} />
                <AvatarFallback className="text-xs">
                  {achievement.referrer_username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  @{achievement.referrer_username}
                </p>
                <p className="text-[10px] text-muted-foreground">Davet Eden</p>
              </div>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardContent>
        )}

        {/* Organization Info */}
        {hasOrganization && showOrganization && achievement.organization_name && (
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Avatar className="h-6 w-6">
                <AvatarImage src={achievement.organization_logo_url} />
                <AvatarFallback className="text-xs">
                  <Building2 className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{achievement.organization_name}</p>
                <p className="text-[10px] text-muted-foreground">Organizasyon Ödülü</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  // Default variant (detailed)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="text-6xl">{definition?.icon || '🏆'}</div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-1">{definition?.title}</CardTitle>
                <CardDescription>{definition?.description}</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {definition?.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(achievement.earned_at).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
            {showSettings && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ödül Kartı Ayarları</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hasReferrer && (
                    <DropdownMenuCheckboxItem
                      checked={showReferrer}
                      onCheckedChange={handleToggleReferrer}
                    >
                      {showReferrer ? (
                        <Eye className="mr-2 h-4 w-4" />
                      ) : (
                        <EyeOff className="mr-2 h-4 w-4" />
                      )}
                      Referansı Göster
                    </DropdownMenuCheckboxItem>
                  )}
                  {hasOrganization && (
                    <DropdownMenuCheckboxItem
                      checked={showOrganization}
                      onCheckedChange={handleToggleOrganization}
                    >
                      {showOrganization ? (
                        <Eye className="mr-2 h-4 w-4" />
                      ) : (
                        <EyeOff className="mr-2 h-4 w-4" />
                      )}
                      Organizasyonu Göster
                    </DropdownMenuCheckboxItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Referrer Info */}
          {hasReferrer && showReferrer && achievement.referrer_username && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Davet Eden</p>
              <Link
                href={`/${achievement.referrer_username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-10 w-10 ring-2 ring-purple-500/50">
                  <AvatarImage src={achievement.referrer_avatar_url} />
                  <AvatarFallback>
                    {achievement.referrer_username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    @{achievement.referrer_username}
                  </p>
                  <p className="text-xs text-muted-foreground">Profile git →</p>
                </div>
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          )}

          {/* Organization Info */}
          {hasOrganization && showOrganization && achievement.organization_name && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Organizasyon Ödülü
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-blue-500/50">
                  <AvatarImage src={achievement.organization_logo_url} />
                  <AvatarFallback>
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{achievement.organization_name}</p>
                  <p className="text-xs text-muted-foreground">Kurumsal Partner</p>
                </div>
              </div>
            </div>
          )}

          {/* Reward Info */}
          {achievement.reward_type && achievement.reward_amount && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">
                      {achievement.reward_type === 'storage' && `${achievement.reward_amount} MB Depolama`}
                      {achievement.reward_type === 'premium_days' && `${achievement.reward_amount} Gün Premium`}
                      {achievement.reward_type === 'badge' && 'Özel Rozet'}
                      {achievement.reward_type === 'feature_unlock' && 'Özellik Kilidi Açıldı'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {achievement.reward_claimed ? 'Ödül alındı' : 'Ödülü al'}
                    </p>
                  </div>
                </div>
                {!achievement.reward_claimed && (
                  <Button
                    size="sm"
                    onClick={handleClaimReward}
                    disabled={claiming}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    {claiming ? 'Alınıyor...' : 'Ödülü Al'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {/* Privacy Hash Info (for transparency) */}
        {achievement.referrer_hash && (
          <CardFooter className="pt-0">
            <p className="text-[10px] text-muted-foreground font-mono truncate w-full">
              🔒 Gizlilik Hash: {achievement.referrer_hash.slice(0, 16)}...
            </p>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
