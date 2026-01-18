'use client';

/**
 * Profile Canvas Component
 * 
 * Kullanıcının kendi profilini düzenleyebileceği ve görüntüleyebileceği tuval.
 * Bio, kapak resmi, tema, öne çıkan öğeler ve sosyal bağlantıları yönetir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { profileFeedService, ProfileCanvas as ProfileCanvasType, FeedItem } from '@/lib/profile-feed-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Settings,
  Edit3,
  Camera,
  Link2,
  Globe,
  Lock,
  Users,
  Heart,
  Eye,
  MessageSquare,
  Share2,
  Plus,
  Trash2,
  Check,
  X,
  Star,
  Verified,
  ExternalLink,
  Grid3X3,
  List,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileCanvasProps {
  userId?: string;
  slug?: string;
  isOwnProfile?: boolean;
  onNavigate?: (item: any) => void;
}

interface SocialLinkInput {
  platform: string;
  url: string;
  icon?: string;
}

const SOCIAL_PLATFORMS = [
  { id: 'twitter', label: 'Twitter/X', icon: '𝕏' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'github', label: 'GitHub', icon: '🐙' },
  { id: 'discord', label: 'Discord', icon: '🎮' },
  { id: 'twitch', label: 'Twitch', icon: '📺' },
  { id: 'website', label: 'Website', icon: '🌐' },
];

export function ProfileCanvasComponent({
  userId,
  slug,
  isOwnProfile = false,
  onNavigate,
}: ProfileCanvasProps) {
  const { user } = useAppStore();
  const [profile, setProfile] = useState<ProfileCanvasType | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProfileCanvasType>>({});
  const [newSocialLink, setNewSocialLink] = useState<SocialLinkInput>({ platform: '', url: '' });
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        let profileData: ProfileCanvasType | null = null;

        if (slug) {
          profileData = await profileFeedService.getProfileBySlug(slug);
        } else if (userId) {
          profileData = await profileFeedService.getProfileCanvas(userId);
        } else if (user?.id) {
          profileData = await profileFeedService.getProfileCanvas(user.id);
        }

        if (profileData) {
          setProfile(profileData);
          setEditForm(profileData);

          // Load feed items
          const items = await profileFeedService.getFeedItems({
            feedType: 'user',
            userId: user?.id,
            targetUserId: profileData.user_id,
            limit: 20,
          });
          setFeedItems(items);

          // Check following status
          if (user?.id && user.id !== profileData.user_id) {
            const following = await profileFeedService.isFollowing(user.id, profileData.user_id);
            setIsFollowing(following);
          }
        } else if (isOwnProfile && user?.id) {
          // Create profile if own profile doesn't exist
          const newProfile = await profileFeedService.createProfileCanvas(
            user.id,
            user.email?.split('@')[0] || 'User'
          );
          if (newProfile) {
            setProfile(newProfile);
            setEditForm(newProfile);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, slug, user?.id, isOwnProfile]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile?.user_id) return;

    const unsubscribe = profileFeedService.subscribeToProfileUpdates(
      profile.user_id,
      (payload) => {
        if (payload.new) {
          setProfile(payload.new as ProfileCanvasType);
        }
      }
    );

    return unsubscribe;
  }, [profile?.user_id]);

  const handleSaveProfile = async () => {
    if (!user?.id || !profile) return;

    const updated = await profileFeedService.updateProfileCanvas(user.id, editForm);
    if (updated) {
      setProfile(updated);
      setIsEditing(false);
    }
  };

  const handleFollow = async () => {
    if (!user?.id || !profile?.user_id) return;

    const result = await profileFeedService.followUser(user.id, profile.user_id);
    setIsFollowing(result);
  };

  const handleAddSocialLink = () => {
    if (!newSocialLink.platform || !newSocialLink.url) return;

    const platform = SOCIAL_PLATFORMS.find((p) => p.id === newSocialLink.platform);
    const currentLinks = editForm.social_links || [];

    setEditForm({
      ...editForm,
      social_links: [
        ...currentLinks,
        {
          platform: newSocialLink.platform,
          url: newSocialLink.url,
          icon: platform?.icon,
        },
      ],
    });

    setNewSocialLink({ platform: '', url: '' });
  };

  const handleRemoveSocialLink = (index: number) => {
    const currentLinks = editForm.social_links || [];
    setEditForm({
      ...editForm,
      social_links: currentLinks.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">Profil bulunamadı</p>
      </div>
    );
  }

  const canEdit = isOwnProfile || user?.id === profile.user_id;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
        {profile.cover_image_url && (
          <img
            src={profile.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        {canEdit && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4"
            onClick={() => setIsEditing(true)}
          >
            <Camera className="h-4 w-4 mr-2" />
            Kapak Değiştir
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <div className="relative px-6 pb-4">
        <div className="flex items-end gap-4 -mt-12">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {profile.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold truncate">{profile.display_name}</h1>
              {profile.is_verified && (
                <Badge variant="secondary" className="gap-1">
                  <Verified className="h-3 w-3" />
                  Doğrulanmış
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">@{profile.slug}</p>
          </div>

          <div className="flex gap-2">
            {canEdit ? (
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Profil Düzenle</DialogTitle>
                    <DialogDescription>
                      Profilinizi güncelleyin ve kişiselleştirin
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Temel Bilgiler</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Görünen Ad</Label>
                          <Input
                            value={editForm.display_name || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, display_name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Kullanıcı Adı</Label>
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-1">@</span>
                            <Input
                              value={editForm.slug || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, slug: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          value={editForm.bio || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, bio: e.target.value })
                          }
                          placeholder="Kendinizi tanıtın..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Images */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Görseller</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Avatar URL</Label>
                          <Input
                            value={editForm.avatar_url || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, avatar_url: e.target.value })
                            }
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Kapak Resmi URL</Label>
                          <Input
                            value={editForm.cover_image_url || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, cover_image_url: e.target.value })
                            }
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Settings */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Ayarlar</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Görünürlük</Label>
                          <Select
                            value={editForm.visibility}
                            onValueChange={(v) =>
                              setEditForm({
                                ...editForm,
                                visibility: v as ProfileCanvasType['visibility'],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  Herkese Açık
                                </div>
                              </SelectItem>
                              <SelectItem value="followers-only">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Sadece Takipçiler
                                </div>
                              </SelectItem>
                              <SelectItem value="private">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-4 w-4" />
                                  Özel
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tema</Label>
                          <Select
                            value={editForm.theme}
                            onValueChange={(v) =>
                              setEditForm({
                                ...editForm,
                                theme: v as ProfileCanvasType['theme'],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="system">Sistem</SelectItem>
                              <SelectItem value="light">Açık</SelectItem>
                              <SelectItem value="dark">Koyu</SelectItem>
                              <SelectItem value="custom">Özel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Düzen</Label>
                          <Select
                            value={editForm.layout}
                            onValueChange={(v) =>
                              setEditForm({
                                ...editForm,
                                layout: v as ProfileCanvasType['layout'],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="grid">Izgara</SelectItem>
                              <SelectItem value="masonry">Masonry</SelectItem>
                              <SelectItem value="list">Liste</SelectItem>
                              <SelectItem value="canvas">Tuval</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Sosyal Bağlantılar</h3>
                      <div className="space-y-2">
                        {(editForm.social_links || []).map((link, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-lg">{link.icon}</span>
                            <span className="flex-1 text-sm truncate">{link.url}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSocialLink(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={newSocialLink.platform}
                          onValueChange={(v) =>
                            setNewSocialLink({ ...newSocialLink, platform: v })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {SOCIAL_PLATFORMS.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <span className="flex items-center gap-2">
                                  <span>{p.icon}</span>
                                  {p.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={newSocialLink.url}
                          onChange={(e) =>
                            setNewSocialLink({ ...newSocialLink, url: e.target.value })
                          }
                          placeholder="URL"
                          className="flex-1"
                        />
                        <Button onClick={handleAddSocialLink} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleSaveProfile}>Kaydet</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Takip Ediliyor
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Takip Et
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-muted-foreground">{profile.bio}</p>
        )}

        {/* Social Links */}
        {profile.social_links && profile.social_links.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.social_links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{link.icon}</span>
                <span className="capitalize">{link.platform}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <button className="text-center hover:bg-accent rounded-lg p-2 transition-colors">
            <div className="font-bold">{profile.stats?.posts || 0}</div>
            <div className="text-xs text-muted-foreground">Gönderi</div>
          </button>
          <button className="text-center hover:bg-accent rounded-lg p-2 transition-colors">
            <div className="font-bold">{profile.stats?.followers || 0}</div>
            <div className="text-xs text-muted-foreground">Takipçi</div>
          </button>
          <button className="text-center hover:bg-accent rounded-lg p-2 transition-colors">
            <div className="font-bold">{profile.stats?.following || 0}</div>
            <div className="text-xs text-muted-foreground">Takip</div>
          </button>
          <div className="text-center p-2">
            <div className="font-bold">{profile.stats?.total_likes || 0}</div>
            <div className="text-xs text-muted-foreground">Beğeni</div>
          </div>
          <div className="text-center p-2">
            <div className="font-bold">{profile.stats?.total_views || 0}</div>
            <div className="text-xs text-muted-foreground">Görüntülenme</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-2 border-b">
          <TabsList>
            <TabsTrigger value="posts">Gönderiler</TabsTrigger>
            <TabsTrigger value="featured">Öne Çıkanlar</TabsTrigger>
            <TabsTrigger value="saved">Kaydedilenler</TabsTrigger>
          </TabsList>

          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="posts" className="m-0 p-4">
            {feedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Henüz gönderi yok</p>
                {canEdit && (
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Gönderini Paylaş
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                    : 'flex flex-col gap-4'
                )}
              >
                <AnimatePresence>
                  {feedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <FeedItemCard
                        item={item}
                        viewMode={viewMode}
                        onNavigate={onNavigate}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured" className="m-0 p-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Öne çıkan öğeler</p>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="m-0 p-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Kaydedilen öğeler</p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

// Feed Item Card Component
function FeedItemCard({
  item,
  viewMode,
  onNavigate,
}: {
  item: FeedItem;
  viewMode: 'grid' | 'list';
  onNavigate?: (item: any) => void;
}) {
  const isGrid = viewMode === 'grid';

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-lg',
        isGrid ? 'aspect-square overflow-hidden' : 'flex flex-row'
      )}
      onClick={() => onNavigate?.(item.item_data)}
    >
      {/* Thumbnail */}
      {item.item_data && 'thumbnail' in item.item_data && (
        <div
          className={cn(
            'bg-muted overflow-hidden',
            isGrid ? 'h-full w-full relative' : 'w-32 h-32 flex-shrink-0'
          )}
        >
          {(item.item_data as any).thumbnail ? (
            <img
              src={(item.item_data as any).thumbnail}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-4xl opacity-50">
                {item.item_type === 'video' ? '🎬' : item.item_type === 'folder' ? '📁' : '📄'}
              </span>
            </div>
          )}

          {/* Overlay stats for grid view */}
          {isGrid && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {item.like_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {item.comment_count}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content for list view */}
      {!isGrid && (
        <CardContent className="flex-1 p-4">
          <h3 className="font-medium truncate">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {item.like_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {item.comment_count}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {item.view_count}
            </span>
            {item.average_rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {item.average_rating.toFixed(1)}
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default ProfileCanvasComponent;
