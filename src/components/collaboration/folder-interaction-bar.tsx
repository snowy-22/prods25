'use client';

/**
 * Folder Interaction Bar
 * Rating, like, comment, share, save buttons for folders
 * Shown in the folder header area (gray zone in design)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  MoreHorizontal,
  Flag,
  Copy,
  ExternalLink,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  FolderEngagementStats,
  FolderCollaborationSettings,
} from '@/lib/collaboration-types';
import {
  toggleFolderLike,
  saveFolder,
  unsaveFolder,
  rateFolder,
  getFolderEngagementStats,
} from '@/lib/collaboration-manager';
import { useAppStore } from '@/lib/store';

interface FolderInteractionBarProps {
  folderId: string;
  folderName: string;
  isOwner: boolean;
  settings?: FolderCollaborationSettings;
  className?: string;
  compact?: boolean;
  onComment?: () => void;
  onShare?: () => void;
}

export function FolderInteractionBar({
  folderId,
  folderName,
  isOwner,
  settings,
  className,
  compact = false,
  onComment,
  onShare,
}: FolderInteractionBarProps) {
  const { user, username } = useAppStore();
  const [stats, setStats] = useState<FolderEngagementStats | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewText, setReviewText] = useState('');

  // Load engagement stats
  useEffect(() => {
    loadStats();
  }, [folderId]);

  const loadStats = async () => {
    const data = await getFolderEngagementStats(folderId);
    if (data) setStats(data);
  };

  const handleLike = async () => {
    if (!user || !username) return;
    setIsLoading(true);
    
    const result = await toggleFolderLike(
      folderId,
      user.id,
      username,
      undefined
    );
    
    setIsLiked(result.liked);
    setStats(prev => prev ? { ...prev, totalLikes: result.totalLikes } : null);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    
    if (isSaved) {
      await unsaveFolder(folderId, user.id);
      setIsSaved(false);
      setStats(prev => prev ? { ...prev, totalSaves: prev.totalSaves - 1 } : null);
    } else {
      await saveFolder(folderId, user.id);
      setIsSaved(true);
      setStats(prev => prev ? { ...prev, totalSaves: prev.totalSaves + 1 } : null);
    }
    
    setIsLoading(false);
  };

  const handleRate = async (rating: number) => {
    if (!user || !username) return;
    setUserRating(rating);
    
    await rateFolder(
      folderId,
      user.id,
      username,
      undefined,
      rating,
      reviewText || undefined
    );
    
    setIsRatingOpen(false);
    loadStats();
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      setIsShareOpen(true);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/folder/${folderId}`;
    navigator.clipboard.writeText(url);
  };

  // Check permissions
  const canRate = !isOwner && (settings?.allowPublicRate ?? true);
  const canSave = !isOwner && (settings?.allowSave ?? true);
  const canShare = settings?.allowShare ?? true;
  const canComment = settings?.allowPublicComment ?? true;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <TooltipProvider delayDuration={300}>
          {/* Like */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleLike}
                disabled={isLoading || isOwner}
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{stats?.totalLikes || 0} beğeni</p>
            </TooltipContent>
          </Tooltip>

          {/* Comment */}
          {canComment && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onComment}
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{stats?.totalComments || 0} yorum</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Save */}
          {canSave && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSaved ? 'Kaydedildi' : 'Kaydet'}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-muted/50', className)}>
      {/* Rating */}
      {canRate && (
        <Popover open={isRatingOpen} onOpenChange={setIsRatingOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8"
            >
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-3.5 w-3.5 transition-colors',
                      star <= (hoverRating || userRating || Math.round(stats?.averageRating || 0))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    )}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {stats?.averageRating?.toFixed(1) || '0.0'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-3">
              <div className="text-sm font-medium">Bu klasörü puanla</div>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="p-1 hover:scale-110 transition-transform"
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      className={cn(
                        'h-6 w-6 transition-colors',
                        star <= (hoverRating || userRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Yorum ekle (isteğe bağlı)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="h-20 resize-none text-sm"
              />
              <div className="text-xs text-muted-foreground text-center">
                {stats?.ratingCount || 0} değerlendirme
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Like */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 h-8"
        onClick={handleLike}
        disabled={isLoading || isOwner}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-colors',
            isLiked ? 'fill-red-500 text-red-500' : ''
          )}
        />
        <span className="text-xs">{stats?.totalLikes || 0}</span>
      </Button>

      {/* Comment */}
      {canComment && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          onClick={onComment}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{stats?.totalComments || 0}</span>
        </Button>
      )}

      {/* Share */}
      {canShare && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          <span className="text-xs">Paylaş</span>
        </Button>
      )}

      {/* Save */}
      {canSave && (
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1.5 h-8', isSaved && 'text-primary')}
          onClick={handleSave}
          disabled={isLoading}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          <span className="text-xs">{isSaved ? 'Kaydedildi' : 'Kaydet'}</span>
        </Button>
      )}

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Klasörü Paylaş</DialogTitle>
            <DialogDescription>
              {folderName} klasörünü paylaşın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={`${window.location.origin}/folder/${folderId}`}
                readOnly
                className="flex-1"
              />
              <Button size="icon" variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex-1 gap-2">
                <ExternalLink className="h-4 w-4" />
                Twitter
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <Send className="h-4 w-4" />
                Telegram
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FolderInteractionBar;
