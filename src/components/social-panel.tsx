"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Users, UserPlus, Search, ExternalLink, CheckCircle2, Heart, MessageCircle, Eye, Award, Trophy, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { SAMPLE_PROFILES, SAMPLE_ITEMS, getSampleItemsForUser, SAMPLE_COMMENTS } from '@/lib/sample-social-data';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatar_url: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  verified: boolean;
  badge?: string;
}

export function SocialPanel() {
  const { user } = useAppStore();
  const { toast } = useToast();
  
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');

  
  // Sample profiles - 12 adet
  const displayProfiles = useMemo(() => SAMPLE_PROFILES, []);
  
  // Filtered profiles based on search
  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return displayProfiles;
    
    const query = searchQuery.toLowerCase();
    return displayProfiles.filter(
      (p) =>
        p.username.toLowerCase().includes(query) ||
        p.displayName.toLowerCase().includes(query) ||
        p.bio?.toLowerCase().includes(query)
    );
  }, [searchQuery, displayProfiles]);

  const handleFollowUser = (profileId: string) => {
    toast({
      title: "Takip edildi! ✅",
      description: `Profili başarıyla takip ettiniz.`,
    });
  };

  const handleViewProfile = (profile: Profile) => {
    setSelectedProfile(profile);
  };

  // Eğer profil seçilmişse, profil detayını göster
  if (selectedProfile) {
    return <ProfileDetailView profile={selectedProfile} onBack={() => setSelectedProfile(null)} />;
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Keşfet</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Trend</span>
          </TabsTrigger>
          <TabsTrigger value="followers" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Takipçiler</span>
          </TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="flex-1 flex flex-col min-h-0">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Profil ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Profil bulunamadı</p>
                </div>
              ) : (
                filteredProfiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onViewProfile={() => handleViewProfile(profile)}
                    onFollow={() => handleFollowUser(profile.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending" className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {/* Top profilleri listelendirecek (en çok takipçi, en çok beğeni, en çok share) */}
              {[...displayProfiles]
                .sort((a, b) => b.followerCount - a.followerCount)
                .slice(0, 8)
                .map((profile, idx) => (
                  <div key={profile.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-bold text-lg">#{idx + 1}</span>
                      <span>{profile.followerCount.toLocaleString('tr-TR')} Takipçi</span>
                    </div>
                    <ProfileCard
                      profile={profile}
                      onViewProfile={() => handleViewProfile(profile)}
                      onFollow={() => handleFollowUser(profile.id)}
                      showStats={true}
                    />
                  </div>
                ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Followers Tab */}
        <TabsContent value="followers" className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {displayProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz takipçiniz yok</p>
                </div>
              ) : (
                displayProfiles.slice(0, 6).map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onViewProfile={() => handleViewProfile(profile)}
                    onFollow={() => handleFollowUser(profile.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Profile Card Component - List view
 */
function ProfileCard({
  profile,
  onViewProfile,
  onFollow,
  showStats = false,
}: {
  profile: Profile;
  onViewProfile: () => void;
  onFollow: () => void;
  showStats?: boolean;
}) {
  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={onViewProfile}>
      <CardContent className="p-3">
        <div className="flex gap-3">
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage src={profile.avatar_url} alt={profile.displayName} />
            <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{profile.displayName}</h3>
              {profile.verified && <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
            
            {profile.badge && (
              <Badge variant="secondary" className="text-xs mt-1">
                <Award className="w-3 h-3 mr-1" />
                {profile.badge}
              </Badge>
            )}

            {profile.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{profile.bio}</p>
            )}

            {showStats && (
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>❤️ {profile.likeCount.toLocaleString('tr-TR')}</span>
                <span>💬 {profile.commentCount.toLocaleString('tr-TR')}</span>
                <span>👁️ {(profile.itemCount * 100).toLocaleString('tr-TR')}</span>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onFollow();
                }}
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Takip Et
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile();
                }}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Profile Detail View - Full profile page
 */
function ProfileDetailView({
  profile,
  onBack,
}: {
  profile: Profile;
  onBack: () => void;
}) {
  const items = getSampleItemsForUser(profile.id);
  const [selectedItem, setSelectedItem] = useState(items[0]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-3 flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onBack}>
          ← Geri
        </Button>
        <h2 className="font-bold flex-1">{profile.displayName}</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Profile Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 mb-4">
                <Avatar className="w-20 h-20 flex-shrink-0">
                  <AvatarImage src={profile.avatar_url} alt={profile.displayName} />
                  <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{profile.displayName}</h3>
                    {profile.verified && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>
                  
                  {profile.badge && (
                    <Badge className="mb-2">
                      <Award className="w-3 h-3 mr-1" />
                      {profile.badge}
                    </Badge>
                  )}

                  {profile.bio && (
                    <p className="text-sm mb-3">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-muted rounded">
                  <div className="text-lg font-bold">{profile.itemCount}</div>
                  <div className="text-xs text-muted-foreground">İçerik</div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="text-lg font-bold">{profile.followerCount.toLocaleString('tr-TR')}</div>
                  <div className="text-xs text-muted-foreground">Takipçi</div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="text-lg font-bold">{profile.followingCount.toLocaleString('tr-TR')}</div>
                  <div className="text-xs text-muted-foreground">Takip</div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="text-lg font-bold">{(profile.likeCount / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-muted-foreground">Beğeni</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button className="flex-1" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Takip Et
                </Button>
                <Button variant="outline" className="flex-1" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mesaj
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Items/Posts */}
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              İçerikleri ({items.length})
            </h3>

            {items.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  <p>Henüz içerik yok</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className="hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        {item.thumbnail && (
                          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-2 mb-1">{item.title}</h4>
                          <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {item.views.toLocaleString('tr-TR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {item.likes.toLocaleString('tr-TR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {item.comments.toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.createdAt), { locale: tr, addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Selected Item Details */}
          {selectedItem && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{selectedItem.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedItem.thumbnail && (
                  <img
                    src={selectedItem.thumbnail}
                    alt={selectedItem.title}
                    className="w-full rounded-lg"
                  />
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted p-2 rounded text-center">
                    <div className="text-lg font-bold text-primary">{selectedItem.views.toLocaleString('tr-TR')}</div>
                    <div className="text-xs text-muted-foreground">Görüntülenme</div>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <div className="text-lg font-bold text-red-500">{selectedItem.likes.toLocaleString('tr-TR')}</div>
                    <div className="text-xs text-muted-foreground">Beğeni</div>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <div className="text-lg font-bold text-blue-500">{selectedItem.comments.toLocaleString('tr-TR')}</div>
                    <div className="text-xs text-muted-foreground">Yorum</div>
                  </div>
                  <div className="bg-muted p-2 rounded text-center">
                    <div className="text-lg font-bold text-green-500">{selectedItem.shares.toLocaleString('tr-TR')}</div>
                    <div className="text-xs text-muted-foreground">Paylaşım</div>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Son Yorumlar
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {SAMPLE_COMMENTS.filter((c) => c.itemId === selectedItem.id).map((comment) => (
                      <div key={comment.id} className="text-xs bg-muted/50 p-2 rounded">
                        <div className="font-semibold text-blue-600">{comment.username}</div>
                        <p className="text-muted-foreground">{comment.content}</p>
                        <div className="text-muted-foreground text-xs mt-1">
                          {formatDistanceToNow(new Date(comment.createdAt), { locale: tr, addSuffix: true })}
                        </div>
                      </div>
                    ))}
                    {SAMPLE_COMMENTS.filter((c) => c.itemId === selectedItem.id).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Henüz yorum yok</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
