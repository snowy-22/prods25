'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { 
  Image as ImageIcon, 
  Video, 
  Grid, 
  Link as LinkIcon, 
  Box, 
  Puzzle, 
  Send,
  X,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ContentItem } from '@/lib/initial-content';

export function CreatePostCard() {
  const { username, addSocialPost, user, itemToShare, setItemToShare } = useAppStore();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachments, setAttachments] = useState<ContentItem[]>([]);
  const { toast } = useToast();

  // Handle item to share from context menu
  useEffect(() => {
    if (itemToShare) {
      setAttachments(prev => {
        if (prev.find(a => a.id === itemToShare.id)) return prev;
        return [...prev, itemToShare];
      });
      setIsExpanded(true);
      // Clear it so it doesn't keep adding on re-mount
      setItemToShare(null);
    }
  }, [itemToShare, setItemToShare]);

  const handlePost = () => {
    if (!content.trim() && attachments.length === 0) return;

    // Parse mentions (@username) and hashtags (^hashtag)
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const hashtagRegex = /\^([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
    const mentions = Array.from(content.matchAll(mentionRegex)).map(m => m[1]);
    const hashtags = Array.from(content.matchAll(hashtagRegex)).map(h => h[1]);

    const newPost: ContentItem = {
      id: `post-${Date.now()}`,
      type: 'social-post',
      title: content.slice(0, 50),
      content: content,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author_id: user?.id || 'anonymous',
      author_name: username || 'Anonim',
      attachments: attachments,
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      metadata: {
        mentions,
        hashtags,
      },
    };

    addSocialPost(newPost);

    toast({
      title: "Gönderi paylaşıldı!",
      description: "Sosyal akışınıza başarıyla eklendi.",
    });

    setContent('');
    setAttachments([]);
    setIsExpanded(false);
  };

  const addDummyAttachment = (type: any) => {
    const dummy: ContentItem = {
      id: `attach-${Date.now()}`,
      type: type,
      title: `Örnek ${type}`,
      url: type === 'video' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAttachments([...attachments, dummy]);
  };

  return (
    <Card className="mb-4 overflow-hidden border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username || 'User'}`} />
            <AvatarFallback>{username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Neler oluyor?"
              className={cn(
                "min-h-[40px] resize-none border-none bg-transparent p-0 focus-visible:ring-0 text-base",
                isExpanded || attachments.length > 0 ? "min-h-[80px]" : ""
              )}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
            />

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pb-2">
                {attachments.map((attr) => (
                  <div key={attr.id} className="relative group bg-accent/20 rounded-md p-2 border border-primary/10 flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                       {attr.type === 'video' && <Video className="h-4 w-4" />}
                       {attr.type === 'image' && <ImageIcon className="h-4 w-4" />}
                       {attr.type === 'widget' && <Puzzle className="h-4 w-4" />}
                       {attr.type === '3d' && <Box className="h-4 w-4" />}
                       {!['video', 'image', 'widget', '3d'].includes(attr.type) && <Grid className="h-4 w-4" />}
                    </div>
                    <span className="text-xs truncate flex-1 font-medium">{attr.title}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setAttachments(attachments.filter(a => a.id !== attr.id))}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {isExpanded && (
              <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary" 
                    title="Resim Ekle"
                    onClick={() => addDummyAttachment('image')}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary" 
                    title="Video Ekle"
                    onClick={() => addDummyAttachment('video')}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary" 
                    title="Mini-Grid Oluştur"
                    onClick={() => addDummyAttachment('folder')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary" 
                    title="Bağlantı Ekle"
                    onClick={() => addDummyAttachment('website')}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary" 
                    title="3D Model Ekle"
                    onClick={() => addDummyAttachment('3d')}
                  >
                    <Box className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary" 
                    title="Araç Takımı Ekle"
                    onClick={() => addDummyAttachment('widget')}
                  >
                    <Puzzle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsExpanded(false)}
                    className="h-8"
                  >
                    Vazgeç
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handlePost}
                    disabled={!content.trim() && attachments.length === 0}
                    className="h-8 gap-1"
                  >
                    Paylaş <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
