"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  TrendingUp,
  Clock,
  Star,
  Users,
  RefreshCw,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';

interface FeedWidgetProps {
  item: ContentItem;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  onUpdate?: (updates: Partial<ContentItem>) => void;
  onItemClick?: (item: ContentItem) => void;
  isEditing?: boolean;
}

interface FeedItem {
  id: string;
  type: 'post' | 'share' | 'activity';
  title: string;
  content?: string;
  thumbnailUrl?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;
  };
  createdAt: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  rating?: number;
  tags?: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  linkedItem?: ContentItem;
}

export const FeedWidget: React.FC<FeedWidgetProps> = ({
  item,
  size = 'M',
  onUpdate,
  onItemClick,
  isEditing = false
}) => {
  const feedData = item.feedData || {
    feedType: 'discover' as const,
    sortBy: 'recent' as const,
    itemsPerPage: 10,
    showComments: true,
    showRatings: true,
  };

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(feedData.feedType);
  const user = useAppStore((s) => s.user);

  // Mock feed data - in production this would come from Supabase
  const mockFeedItems: FeedItem[] = [
    {
      id: 'feed-1',
      type: 'post',
      title: 'Yeni proje paylaşımı',
      content: 'Bu hafta üzerinde çalıştığım React dashboard projesini tamamladım. Feedback bekliyorum!',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
      author: {
        id: 'user-1',
        name: 'Ahmet Yılmaz',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmet',
        isVerified: true,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      stats: { likes: 24, comments: 8, shares: 3, views: 156 },
      rating: 4.5,
      tags: ['React', 'Dashboard', 'UI/UX'],
      isLiked: false,
      isSaved: false,
    },
    {
      id: 'feed-2',
      type: 'share',
      title: 'Faydalı bir kaynak buldum',
      content: 'TypeScript best practices için harika bir rehber. Mutlaka göz atın!',
      author: {
        id: 'user-2',
        name: 'Zeynep Kaya',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zeynep',
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      stats: { likes: 45, comments: 12, shares: 18, views: 324 },
      tags: ['TypeScript', 'Tutorial'],
      isLiked: true,
      isSaved: true,
    },
    {
      id: 'feed-3',
      type: 'activity',
      title: 'Yeni rozet kazandı! 🏆',
      content: 'Ahmet "100 Paylaşım" rozetini kazandı!',
      author: {
        id: 'user-1',
        name: 'Ahmet Yılmaz',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmet',
        isVerified: true,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      stats: { likes: 67, comments: 23, shares: 0, views: 445 },
    },
  ];

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    const timer = setTimeout(() => {
      setFeedItems(mockFeedItems);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleLike = useCallback((feedItemId: string) => {
    setFeedItems((prev) =>
      prev.map((fi) =>
        fi.id === feedItemId
          ? {
              ...fi,
              isLiked: !fi.isLiked,
              stats: {
                ...fi.stats,
                likes: fi.isLiked ? fi.stats.likes - 1 : fi.stats.likes + 1,
              },
            }
          : fi
      )
    );
  }, []);

  const handleSave = useCallback((feedItemId: string) => {
    setFeedItems((prev) =>
      prev.map((fi) =>
        fi.id === feedItemId ? { ...fi, isSaved: !fi.isSaved } : fi
      )
    );
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 1000 * 60) return 'Az önce';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))} dk`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))} sa`;
    return date.toLocaleDateString('tr-TR');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const sizeClasses = {
    XS: 'text-xs',
    S: 'text-sm',
    M: 'text-base',
    L: 'text-lg',
    XL: 'text-xl',
  };

  return (
    <Card className={cn("w-full h-full flex flex-col overflow-hidden", sizeClasses[size])}>
      <CardHeader className="pb-2 px-3 pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="my-feed" className="text-xs px-2">
              <Clock className="w-3 h-3 mr-1" />
              Akış
            </TabsTrigger>
            <TabsTrigger value="discover" className="text-xs px-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              Keşfet
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs px-2">
              <Users className="w-3 h-3 mr-1" />
              Takip
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-xs px-2">
              <Star className="w-3 h-3 mr-1" />
              Trend
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-center">Henüz içerik yok</p>
            <p className="text-xs text-center mt-1">
              İlk paylaşımı siz yapın!
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {feedItems.map((feedItem) => (
              <div
                key={feedItem.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => feedItem.linkedItem && onItemClick?.(feedItem.linkedItem)}
              >
                {/* Author Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={feedItem.author.avatar} />
                      <AvatarFallback>{feedItem.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">{feedItem.author.name}</span>
                        {feedItem.author.isVerified && (
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(feedItem.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h4 className="font-medium">{feedItem.title}</h4>
                  {feedItem.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {feedItem.content}
                    </p>
                  )}

                  {feedItem.thumbnailUrl && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={feedItem.thumbnailUrl}
                        alt={feedItem.title}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  {feedItem.tags && feedItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {feedItem.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Rating */}
                  {feedItem.rating && feedData.showRatings && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-4 h-4",
                            star <= feedItem.rating!
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                      <span className="text-sm ml-1">{feedItem.rating}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-8 px-2", feedItem.isLiked && "text-red-500")}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(feedItem.id);
                      }}
                    >
                      <Heart className={cn("w-4 h-4 mr-1", feedItem.isLiked && "fill-current")} />
                      <span className="text-xs">{formatNumber(feedItem.stats.likes)}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">{formatNumber(feedItem.stats.comments)}</span>
                    </Button>

                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Share2 className="w-4 h-4 mr-1" />
                      <span className="text-xs">{formatNumber(feedItem.stats.shares)}</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8", feedItem.isSaved && "text-primary")}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(feedItem.id);
                      }}
                    >
                      <Bookmark className={cn("w-4 h-4", feedItem.isSaved && "fill-current")} />
                    </Button>

                    {feedItem.linkedItem && (
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        {!isLoading && feedItems.length > 0 && (
          <div className="p-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 500);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Yenile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedWidget;
