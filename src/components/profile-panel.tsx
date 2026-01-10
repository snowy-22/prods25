'use client';

import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Share2, Grid, Bookmark, Play, Box, Puzzle, Heart, Plus, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ProfilePanelProps {
  onOpenContent?: (item: any) => void;
}

export function ProfilePanel({ onOpenContent }: ProfilePanelProps = {}) {
  const { username, user, socialPosts, profileCanvasId, setProfileCanvasId } = useAppStore();

  const myPosts = socialPosts.filter(p => p.author_id === user?.id);

  const handleItemClick = (item: any) => {
    if (onOpenContent) {
      onOpenContent(item);
    }
  };

  const handleCreateProfileCanvas = () => {
    const id = `profile-canvas-${Date.now()}`;
    setProfileCanvasId(id);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username || 'User'}`} />
            <AvatarFallback>{username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{username || 'Kullanıcı'}</h2>
            <p className="text-sm text-muted-foreground truncate">{user?.email || 'Giriş yapılmadı'}</p>
          </div>
        </div>

        {profileCanvasId ? (
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <div className="text-xs">
                <p className="font-bold">Yayında: Profil Kanvası</p>
                <p className="text-muted-foreground">Herkes görüntüleyebilir</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-8">Düzenle</Button>
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
          <Button variant="outline" size="sm" className="flex-1">
            Profili Düzenle
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="feed" className="flex-1 overflow-hidden flex flex-col pt-2">
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="feed" className="flex-1">Akış</TabsTrigger>
            <TabsTrigger value="tagged" className="flex-1">Etiketlendiklerim</TabsTrigger>
            <TabsTrigger value="saved" className="flex-1">Kaydedilenler</TabsTrigger>
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
          <TabsContent value="tagged" className="m-0 p-4">
            <div className="space-y-4">
              <div className="text-center py-10">
                <User className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-muted-foreground text-sm">Henüz etiketlendiğiniz içerik yok.</p>
                <p className="text-xs text-muted-foreground mt-1">Birisi sizi bir gönderide etiketlediğinde burada görünür.</p>
              </div>
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
