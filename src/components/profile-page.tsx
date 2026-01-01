'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ArrowLeft, Mail, MapPin, Link as LinkIcon, MessageCircle, UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

interface ProfilePageProps {
  userId: string;
  onClose?: () => void;
}

export function ProfilePage({ userId, onClose }: ProfilePageProps) {
  const { user, openInNewTab } = useAppStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0, items: 0 });
  const [userItems, setUserItems] = useState<any[]>([]);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Get follow status
        if (user?.id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .single();

          setIsFollowing(!!followData);
        }

        // Get user stats
        const { count: followerCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);

        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);

        setStats({
          followers: followerCount || 0,
          following: followingCount || 0,
          items: 0
        });
      } catch (error: any) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Hata',
          description: 'Profil yüklenemedi',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, user?.id, toast]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user?.id) {
      toast({
        title: 'Oturum açın',
        description: 'Bu işlem için oturum açmanız gerekir'
      });
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        setIsFollowing(false);
        toast({
          title: 'Başarılı',
          description: `${profile?.username} takibinden çıktınız`
        });
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        setIsFollowing(true);
        toast({
          title: 'Başarılı',
          description: `${profile?.username} takip etmeye başladınız`
        });
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        followers: isFollowing ? prev.followers - 1 : prev.followers + 1
      }));
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Hata',
        description: error.message || 'İşlem başarısız oldu',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Profil bulunamadı</p>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background to-muted/20">
      {onClose && (
        <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b p-4 flex items-center justify-between z-10">
          <h2 className="font-semibold">Profil</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20">
            <AvatarImage src={profile.avatar_url} alt={profile.username} />
            <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-sm text-foreground/80 max-w-md mx-auto">{profile.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.followers}</div>
              <p className="text-xs text-muted-foreground">Takipçi</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.following}</div>
              <p className="text-xs text-muted-foreground">Takip Edilen</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.items}</div>
              <p className="text-xs text-muted-foreground">İçerik</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          {profile.website && (
            <div className="flex items-center gap-3 text-sm">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {profile.website}
              </a>
            </div>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant={isFollowing ? 'secondary' : 'default'}
            className="flex-1"
            onClick={handleFollowToggle}
          >
            {isFollowing ? (
              <>
                <UserMinus className="mr-2 h-4 w-4" />
                Takibi Bırak
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Takip Et
              </>
            )}
          </Button>
          <Button variant="outline" className="flex-1">
            <MessageCircle className="mr-2 h-4 w-4" />
            Mesaj
          </Button>
        </div>

        {/* User Items Tab */}
        <Tabs defaultValue="items" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="items" className="flex-1">İçerikler</TabsTrigger>
            <TabsTrigger value="likes" className="flex-1">Beğeniler</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-2 mt-4">
            {userItems.length > 0 ? (
              userItems.map(item => (
                <Card key={item.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <CardContent className="pt-4">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">Henüz içerik yok</p>
            )}
          </TabsContent>

          <TabsContent value="likes" className="space-y-2 mt-4">
            <p className="text-center text-muted-foreground py-8">Henüz beğeni yok</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
