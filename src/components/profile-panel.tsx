'use client';

import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Share2, Grid, Bookmark, Play, Box, Puzzle, Heart, Plus, Globe, LayoutGrid, Settings, Gift, Copy, BadgeCheck, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { profileService } from '@/lib/profile-service';
import { UserProfile, ReferralStats } from '@/lib/profile-types';
import { useToast } from '@/hooks/use-toast';
import { ProfileSettingsDialog } from './profile-settings-dialog';
import { achievementService } from '@/lib/achievements-service';
import { UserAchievement } from '@/lib/achievements-types';
import { AchievementCard } from './achievement-card';

// Lazy load ProfileCanvasComponent
const ProfileCanvasComponent = dynamic(
  () => import('./profile/profile-canvas').then((mod) => mod.ProfileCanvasComponent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }
);

interface ProfilePanelProps {
  onOpenContent?: (item: any) => void;
}

export function ProfilePanel({ onOpenContent }: ProfilePanelProps = {}) {
  const { username, user, socialPosts, profileCanvasId, setProfileCanvasId } = useAppStore();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'simple' | 'canvas'>('simple');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfileData();
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;
    setAchievementsLoading(true);
    try {
      const userAchievements = await achievementService.getUserAchievements(user.id);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setAchievementsLoading(false);
    }
  };

  const handleAchievementSettingsChange = async (achievementId: string, settings: { show_referrer?: boolean; show_organization?: boolean }) => {
    try {
      await achievementService.updateAchievementSettings(achievementId, settings);
      // Reload achievements
      await loadAchievements();
      toast({
        title: '✓ Ayarlar güncellendi',
        description: 'Ödül görünüm ayarları başarıyla güncellendi.'
      });
    } catch (error) {
      console.error('Failed to update achievement settings:', error);
      toast({
        title: '✗ Hata',
        description: 'Ayarlar güncellenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [profileData, stats] = await Promise.all([
        profileService.getCurrentProfile(),
        profileService.getReferralStats(),
      ]);
      setProfile(profileData);
      setReferralStats(stats);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (referralStats?.share_url) {
      await navigator.clipboard.writeText(referralStats.share_url);
      toast({
        title: 'Kopyalandı!',
        description: 'Davet linki panoya kopyalandı.',
      });
    }
  };

  const copyProfileLink = async () => {
    const profileUrl = profileService.getProfileUrl(profile?.username || username || '');
    await navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'Kopyalandı!',
      description: 'Profil linki panoya kopyalandı.',
    });
  };

  // Akışım: Posts authored by the user
  const myPosts = socialPosts.filter(p => p.author_id === user?.id);
  // Etiketlenenler: Posts where user is tagged (assume post.tags includes user id or username)
  const taggedPosts = socialPosts.filter(p => {
    if (!user) return false;
    // Support both user id and username in tags
    const tags = p.tags || [];
    return tags.includes(user.id) || tags.includes(user.username) || tags.includes(username);
  });

  const handleItemClick = (item: any) => {
    if (onOpenContent) {
      onOpenContent(item);
    }
  };

  const handleCreateProfileCanvas = () => {
    const id = `profile-canvas-${Date.now()}`;
    setProfileCanvasId(id);
    setViewMode('canvas');
  };

  // Full profile canvas view
  if (viewMode === 'canvas') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('simple')}
            className="gap-1"
          >
            ← Geri
          </Button>
          <span className="text-sm font-medium">Profil Tuvalim</span>
          <div className="w-16" />
        </div>
        <div className="flex-1 overflow-hidden">
          <ProfileCanvasComponent
            isOwnProfile={true}
            onNavigate={onOpenContent}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Profile Settings Dialog */}
      <ProfileSettingsDialog open={settingsOpen} onOpenChange={(open) => {
        setSettingsOpen(open);
        if (!open) {
          // Reload profile when dialog closes
          loadProfileData();
        }
      }} />

      <div className="p-4 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || username || 'User'}`} />
            <AvatarFallback>{(profile?.username || username)?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-bold truncate">{profile?.full_name || profile?.username || username || 'Kullanıcı'}</h2>
              {profile?.verified && (
                <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">@{profile?.username || username || 'username'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'Giriş yapılmadı'}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Bio Section */}
        {profile?.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {profile.bio}
          </p>
        )}

        {/* Referral Stats Mini Card */}
        {referralStats && (referralStats.total_referrals > 0 || referralStats.referral_code) && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <div className="text-xs">
                  <p className="font-medium">Davet Kodu: <span className="font-mono font-bold">{referralStats.referral_code}</span></p>
                  <p className="text-muted-foreground">{referralStats.total_referrals} kişi davet edildi</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyReferralLink}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {profileCanvasId ? (
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <div className="text-xs">
                <p className="font-bold">Yayında: Profil Kanvası</p>
                <p className="text-muted-foreground">Herkes görüntüleyebilir</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-8" onClick={() => setViewMode('canvas')}>
              <LayoutGrid className="h-3 w-3 mr-1" />
              Düzenle
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full mb-4 gap-2 border-dashed" 
            variant="outline"
            onClick={handleCreateProfileCanvas}
          >
            <Plus className="h-4 w-4" /> Herkese Açık Kanvas Oluştur
          </Button>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5" />
            Profili Düzenle
          </Button>
          <Button variant="outline" size="sm" onClick={copyProfileLink}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="feed" className="flex-1 overflow-hidden flex flex-col pt-2">
        <div className="px-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="feed">Akışım</TabsTrigger>
            <TabsTrigger value="achievements">
              <Award className="h-3.5 w-3.5 mr-1" />
              Ödüller
            </TabsTrigger>
            <TabsTrigger value="tagged">Etiketli</TabsTrigger>
            <TabsTrigger value="saved">Kayıtlı</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <TabsContent value="feed" className="m-0 p-4">
            <div className="space-y-4">
              {myPosts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center py-10">
                    <Grid className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-muted-foreground text-sm">Henüz bir gönderiniz yok.</p>
                  </CardContent>
                </Card>
              ) : (
                myPosts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="border-primary/5 bg-accent/5 cursor-pointer hover:bg-accent/10 transition-colors"
                    onClick={() => handleItemClick(post)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: tr })}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{post.content}</p>
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="grid grid-cols-2 gap-1">
                           {post.attachments.map((at: any) => (
                              <div key={at.id} className="aspect-video bg-muted rounded flex items-center justify-center text-[10px] text-center p-1">
                                {at.title}
                              </div>
                           ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="achievements" className="m-0 p-4">
            <div className="space-y-4">
              {achievementsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : achievements.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center py-10">
                    <Award className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-muted-foreground text-sm">Henüz bir ödülünüz yok.</p>
                    <p className="text-xs text-muted-foreground mt-1">Arkadaşlarınızı davet edin ve ilk ödülünüzü kazanın!</p>
                  </CardContent>
                </Card>
              ) : (
                achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    variant="compact"
                    showSettings={true}
                    onSettingsChange={(settings) => handleAchievementSettingsChange(achievement.id, settings)}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tagged" className="m-0 p-4">
            <div className="space-y-4">
              {taggedPosts.length === 0 ? (
                <div className="text-center py-10">
                  <User className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-muted-foreground text-sm">Henüz etiketlendiğiniz içerik yok.</p>
                  <p className="text-xs text-muted-foreground mt-1">Birisi sizi bir gönderide etiketlediğinde burada görünür.</p>
                </div>
              ) : (
                taggedPosts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="border-primary/5 bg-accent/5 cursor-pointer hover:bg-accent/10 transition-colors"
                    onClick={() => handleItemClick(post)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: tr })}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{post.content}</p>
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="grid grid-cols-2 gap-1">
                           {post.attachments.map((at: any) => (
                              <div key={at.id} className="aspect-video bg-muted rounded flex items-center justify-center text-[10px] text-center p-1">
                                {at.title}
                              </div>
                           ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="saved" className="m-0 p-4">
            <div className="text-center py-10">
              <Bookmark className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-muted-foreground text-sm">Kaydedilen içerik bulunamadı.</p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
