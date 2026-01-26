/**
 * Realtime Comments & Likes Synchronization
 * Instant comment and like updates with Supabase subscriptions
 */

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useToast } from './use-toast';

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar_url?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemStats {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
}

interface RealtimeCommentsOptions {
  enabled?: boolean;
  autoLoad?: boolean;
}

export function useRealtimeComments(
  itemId: string,
  options: RealtimeCommentsOptions = {}
) {
  const { enabled = true, autoLoad = true } = options;
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<ItemStats>({
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
  });
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [hasLiked, setHasLiked] = useState(false);
  const supabaseRef = useRef(
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    )
  );

  // Load initial comments and stats
  useEffect(() => {
    if (!autoLoad || !itemId) return;

    const loadData = async () => {
      try {
        const [commentsRes, statsRes, likeRes] = await Promise.all([
          fetch(`/api/comments/${itemId}`),
          fetch(`/api/items/${itemId}/stats`),
          fetch(`/api/items/${itemId}/like-status`),
        ]);

        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(data.comments || []);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }

        if (likeRes.ok) {
          const data = await likeRes.json();
          setHasLiked(data.hasLiked);
        }
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [itemId, autoLoad]);

  // Subscribe to realtime comment updates
  useEffect(() => {
    if (!enabled || !itemId) return;

    const supabase = supabaseRef.current;

    const subscription = supabase
      .channel(`comments:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments((prev) => [newComment, ...prev]);
          setStats((prev) => ({
            ...prev,
            commentCount: prev.commentCount + 1,
          }));

          toast({
            title: 'Yeni Yorum',
            description: `${newComment.username} yorum yaptı`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          const deletedId = (payload.old as Comment).id;
          setComments((prev) => prev.filter((c) => c.id !== deletedId));
          setStats((prev) => ({
            ...prev,
            commentCount: Math.max(0, prev.commentCount - 1),
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          const updated = payload.new as Comment;
          setComments((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to comments for item: ${itemId}`);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [itemId, enabled, toast]);

  // Subscribe to likes and stats updates
  useEffect(() => {
    if (!enabled || !itemId) return;

    const supabase = supabaseRef.current;

    const subscription = supabase
      .channel(`item-stats:${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'item_stats',
          filter: `item_id=eq.${itemId}`,
        },
        (payload) => {
          const updated = payload.new as ItemStats;
          setStats(updated);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [itemId, enabled]);

  const addComment = async (content: string) => {
    try {
      const response = await fetch(`/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, content }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments((prev) => [newComment, ...prev]);
        setStats((prev) => ({
          ...prev,
          commentCount: prev.commentCount + 1,
        }));
        return newComment;
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: 'Hata',
        description: 'Yorum eklenemedi',
        variant: 'destructive',
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setStats((prev) => ({
          ...prev,
          commentCount: Math.max(0, prev.commentCount - 1),
        }));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const toggleLike = async () => {
    try {
      const response = await fetch(`/api/items/${itemId}/like`, {
        method: hasLiked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setHasLiked(!hasLiked);
        setStats((prev) => ({
          ...prev,
          likeCount: hasLiked ? prev.likeCount - 1 : prev.likeCount + 1,
        }));

        toast({
          title: hasLiked ? 'Beğeni Geri Alındı' : 'Beğendi',
          duration: 1000,
        });
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  return {
    comments,
    stats,
    hasLiked,
    isLoading,
    addComment,
    deleteComment,
    toggleLike,
  };
}
