"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Users, Building2, UserPlus, UserMinus, Search, ExternalLink, CheckCircle2, Zap, Radio } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { useSocialBroadcast, type BroadcastEvent } from '@/hooks/use-social-broadcast';
import { ProfilePage } from './profile-page';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
  follower_count: number;
  following_count: number;
}

interface Organization {
  id: string;
  username: string;
  display_name: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  organization_type: string;
  follower_count: number;
  member_count: number;
  is_verified: boolean;
}

export function SocialPanel() {
  const { user, openInNewTab, setLayoutMode } = useAppStore();
  const { toast } = useToast();
  const { isConnected, broadcastEvents } = useSocialBroadcast();
  
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [myOrganizations, setMyOrganizations] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showBroadcastFeed, setShowBroadcastFeed] = useState(false);

  // Setup realtime subscriptions
  useEffect(() => {
    if (user) {
      loadFollowers();
      loadFollowing();
      loadOrganizations();
      loadMyOrganizations();

      // Subscribe to realtime updates
      const followSubscription = supabase
        .channel(`followers:${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${user.id}`
        }, () => {
          loadFollowers();
        })
        .subscribe();

      return () => {
        followSubscription.unsubscribe();
      };
    }
  }, [user]);

  const loadFollowers = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        profiles!follows_follower_id_fkey (
          id, username, full_name, avatar_url, bio, follower_count, following_count
        )
      `)
      .eq('following_id', user.id);

    if (error) {
      console.error('Error loading followers:', error);
      return;
    }

    setFollowers(data?.map((f: any) => f.profiles).filter(Boolean) || []);
  };

  const loadFollowing = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey (
          id, username, full_name, avatar_url, bio, follower_count, following_count
        )
      `)
      .eq('follower_id', user.id);

    if (error) {
      console.error('Error loading following:', error);
      return;
    }

    setFollowing(data?.map((f: any) => f.profiles).filter(Boolean) || []);
  };

  const loadOrganizations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('organization_follows')
      .select(`
        organization_id,
        organizations (*)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading organizations:', error);
      return;
    }

    setOrganizations(data?.map((o: any) => o.organizations).filter(Boolean) || []);
  };

  const loadMyOrganizations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        organizations (*)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading my organizations:', error);
      return;
    }

    setMyOrganizations(data?.map((m: any) => m.organizations).filter(Boolean) || []);
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    setIsSearching(false);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setSearchResults(data || []);
  };

  const followUser = async (userId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: userId });

    if (error) {
      toast({
        title: "Hata",
        description: "Takip edilemedi",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Başarılı",
      description: "Kullanıcı takip edildi"
    });

    loadFollowing();
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);

    if (error) {
      toast({
        title: "Hata",
        description: "Takipten çıkılamadı",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Başarılı",
      description: "Takipten çıkıldı"
    });

    loadFollowing();
  };

  const followOrganization = async (orgId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('organization_follows')
      .insert({ user_id: user.id, organization_id: orgId });

    if (error) {
      toast({
        title: "Hata",
        description: "Organizasyon takip edilemedi",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Başarılı",
      description: "Organizasyon takip edildi"
    });

    loadOrganizations();
  };

  const unfollowOrganization = async (orgId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('organization_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('organization_id', orgId);

    if (error) {
      toast({
        title: "Hata",
        description: "Organizasyon takipten çıkılamadı",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Başarılı",
      description: "Organizasyon takipten çıkıldı"
    });

    loadOrganizations();
  };

  const isFollowing = (userId: string) => {
    return following.some(f => f.id === userId);
  };

  const isFollowingOrg = (orgId: string) => {
    return organizations.some(o => o.id === orgId);
  };

  return (
    <>
      {selectedProfile && (
        <div className="absolute inset-0 z-50">
          <ProfilePage
            userId={selectedProfile}
            onClose={() => setSelectedProfile(null)}
          />
        </div>
      )}

      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sosyal
            {isConnected && (
              <Badge variant="default" className="ml-auto text-xs flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Canlı
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="flex-1"
            />
            <Button
              variant={showBroadcastFeed ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowBroadcastFeed(!showBroadcastFeed)}
              title="Canlı Akış"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          {/* Live Broadcast Feed */}
          {showBroadcastFeed && (
            <ScrollArea className="h-full px-4 pb-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Radio className="h-4 w-4 animate-pulse text-red-500" />
                  Canlı Aktivite
                </h3>
                {broadcastEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Henüz aktivite yok</p>
                ) : (
                  broadcastEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-muted/30 rounded-lg border-l-2 border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        // Open as content group in canvas
                        if (event.target.type === 'user') {
                          setSelectedProfile(event.target.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={event.actor.avatar_url} />
                          <AvatarFallback>{event.actor.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">
                            <span className="font-semibold">{event.actor.username}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{event.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.timestamp).toLocaleTimeString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {!showBroadcastFeed && (
            <>
              {searchQuery && (
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold mb-2">Arama Sonuçları</h3>
                    {isSearching ? (
                      <p className="text-sm text-muted-foreground">Aranıyor...</p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sonuç bulunamadı</p>
                    ) : (
                      searchResults.map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                          onClick={() => setSelectedProfile(profile.id)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={profile.avatar_url} />
                              <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{profile.full_name || profile.username}</p>
                              <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                            </div>
                          </div>
                          {profile.id !== user?.id && (
                            <Button
                              variant={isFollowing(profile.id) ? "outline" : "default"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                isFollowing(profile.id) ? unfollowUser(profile.id) : followUser(profile.id);
                              }}
                            >
                              {isFollowing(profile.id) ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}

              {!searchQuery && (
                <Tabs defaultValue="following" className="h-full flex flex-col">
                  <TabsList className="w-full grid grid-cols-3 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
                    <TabsTrigger value="following">Takip ({following.length})</TabsTrigger>
                    <TabsTrigger value="followers">Takipçi ({followers.length})</TabsTrigger>
                    <TabsTrigger value="organizations">Org ({organizations.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="following" className="flex-1 m-0">
                    <ScrollArea className="h-full px-4">
                      <div className="space-y-2 pb-4">
                        {following.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">Henüz kimseyi takip etmiyorsunuz</p>
                        ) : (
                          following.map((profile) => (
                            <div
                              key={profile.id}
                              className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                              onClick={() => setSelectedProfile(profile.id)}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={profile.avatar_url} />
                                  <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{profile.full_name || profile.username}</p>
                                  <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unfollowUser(profile.id);
                                }}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="followers" className="flex-1 m-0">
                    <ScrollArea className="h-full px-4">
                      <div className="space-y-2 pb-4">
                        {followers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">Henüz takipçiniz yok</p>
                        ) : (
                          followers.map((profile) => (
                            <div
                              key={profile.id}
                              className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                              onClick={() => setSelectedProfile(profile.id)}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={profile.avatar_url} />
                                  <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{profile.full_name || profile.username}</p>
                                  <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                                </div>
                              </div>
                              {!isFollowing(profile.id) && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    followUser(profile.id);
                                  }}
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="organizations" className="flex-1 m-0">
                    <ScrollArea className="h-full px-4">
                      <div className="space-y-4 pb-4">
                        {myOrganizations.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold mb-2">Benim Org</h3>
                            <div className="space-y-2">
                              {myOrganizations.map((org) => (
                                <div key={org.id} className="p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                  <div className="flex items-start gap-2">
                                    {org.avatar_url && (
                                      <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarImage src={org.avatar_url} />
                                        <AvatarFallback>{org.display_name[0]}</AvatarFallback>
                                      </Avatar>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <p className="text-sm font-medium">{org.display_name}</p>
                                        {org.is_verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                      </div>
                                      <p className="text-xs text-muted-foreground">@{org.username}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {organizations.length === 0 && myOrganizations.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">Org yok</p>
                        ) : organizations.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold mb-2">Takip Edilen</h3>
                            <div className="space-y-2">
                              {organizations.map((org) => (
                                <div key={org.id} className="p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                  <div className="flex items-start gap-2">
                                    {org.avatar_url && (
                                      <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarImage src={org.avatar_url} />
                                        <AvatarFallback>{org.display_name[0]}</AvatarFallback>
                                      </Avatar>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <p className="text-sm font-medium">{org.display_name}</p>
                                        {org.is_verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                        <Badge variant="outline" className="text-xs">{org.organization_type}</Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">@{org.username}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
