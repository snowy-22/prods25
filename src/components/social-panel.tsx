"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Compass, Users, UserPlus, Search, ExternalLink, CheckCircle2, Heart, MessageCircle, Eye, Award, Trophy, TrendingUp, Play, Grid, Box, Puzzle, Star, Save } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { SAMPLE_PROFILES, SAMPLE_ITEMS, getSampleItemsForUser, SAMPLE_COMMENTS } from '@/lib/sample-social-data';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ContentItem } from '@/lib/initial-content';
import { CreatePostCard } from './social/create-post-card';

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

interface SocialPanelProps {
  onOpenContent?: (item: ContentItem) => void;
}

export function SocialPanel({ onOpenContent }: SocialPanelProps = {}) {
  const { user, socialPosts, addSocialPost, updateSocialPost } = useAppStore();
  const { toast } = useToast();
  
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('content');

  // Combined feed: store posts + sample items
  const combinedFeed = useMemo(() => {
    const formattedStorePosts = socialPosts.map(post => ({
      id: post.id,
      title: post.title,
      type: 'social-post',
      authorName: post.author_name || 'Anonim',
      authorId: post.author_id,
      views: post.viewCount || 0,
      likes: post.likeCount || 0,
      comments: post.commentCount || 0,
      createdAt: post.createdAt,
      content: post.content,
      attachments: post.attachments,
      isStorePost: true
    }));

    return [...formattedStorePosts, ...SAMPLE_ITEMS].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [socialPosts]);

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

  const handleContentClick = (item: any) => {
    if (onOpenContent) {
      const contentItem: ContentItem = {
        id: item.id,
        type: item.type || 'video',
        title: item.title,
        url: item.url,
        thumbnail_url: item.thumbnail,
        author_name: item.authorName,
        viewCount: item.views,
        likeCount: item.likes,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        parentId: null
      };
      onOpenContent(contentItem);
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" className="gap-2">
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Keşfet</span>
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Kanallar</span>
          </TabsTrigger>
          <TabsTrigger value="followers" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Takipçiler</span>
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              <CreatePostCard />
              {combinedFeed.slice(0, 20).map((item) => (
                <Card
                  key={item.id}
                  className="hover:bg-accent/20 transition-colors cursor-pointer border-primary/10"
                  onClick={() => handleContentClick(item)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {(item as any).isStorePost ? (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                             <Avatar className="h-6 w-6">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.authorName}`} />
                              <AvatarFallback>{item.authorName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-xs">@{item.authorName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: tr })}
                            </span>
                          </div>
                          
                          <p className="text-sm mb-3 line-clamp-3">
                            {((item as any).content || '').split(/(\s+)/).map((word: string, idx: number) => {
                              // Mention: @username
                              if (/^@([a-zA-Z0-9_]+)/.test(word)) {
                                const username = word.slice(1);
                                return (
                                  <span
                                    key={idx}
                                    className="text-blue-600 font-semibold cursor-pointer hover:underline"
                                    title={`@${username} profiline git`}
                                    onClick={e => {
                                      e.stopPropagation();
                                      // TODO: open profile or filter by username
                                    }}
                                  >{word}</span>
                                );
                              }
                              // Hashtag: ^hashtag
                              if (/^\^([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/.test(word)) {
                                const tag = word.slice(1);
                                return (
                                  <span
                                    key={idx}
                                    className="text-purple-600 font-semibold cursor-pointer hover:underline"
                                    title={`^${tag} etiketiyle filtrele`}
                                    onClick={e => {
                                      e.stopPropagation();
                                      // TODO: filter by hashtag
                                    }}
                                  >{word}</span>
                                );
                              }
                              return word;
                            })}
                          </p>
                          
                          {(item as any).attachments?.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {(item as any).attachments.map((at: any) => (
                                <div key={at.id} className="aspect-video bg-muted rounded overflow-hidden flex items-center justify-center relative">
                                  {at.type === 'video' && <Play className="w-6 h-6 text-primary" />}
                                  {at.type === 'folder' && <Grid className="w-6 h-6 text-primary" />}
                                  {at.type === '3d' && <Box className="w-6 h-6 text-primary" />}
                                  {at.type === 'widget' && <Puzzle className="w-6 h-6 text-primary" />}
                                  <div className="absolute bottom-1 left-1 bg-black/50 px-1 rounded text-[10px] text-white">
                                    {at.title}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex gap-4 items-center pt-2 border-t border-primary/5">
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                              <Heart className="w-3" /> {item.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                              <Star className="w-3" /> Puanla
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs ml-auto">
                              <Save className="w-3" /> Kaydet
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {(item as any).thumbnail && (
                            <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                              <img
                                src={(item as any).thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 mb-1">{item.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{item.authorName}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {item.views.toLocaleString('tr-TR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {item.likes.toLocaleString('tr-TR')}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="flex-1 flex flex-col min-h-0">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kanal ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onViewProfile={() => handleViewProfile(profile)}
                  onFollow={() => handleFollowUser(profile.id)}
                />
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
