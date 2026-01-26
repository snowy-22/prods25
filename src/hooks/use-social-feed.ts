'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SocialPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'link' | 'canvas_share';
  media_url?: string;
  canvas_item_id?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked?: boolean; // Current user liked
  created_at: string;
  updated_at: string;
}

export interface SocialComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  likes_count: number;
  is_liked?: boolean;
  created_at: string;
}

export interface SocialFeedOptions {
  limit?: number;
  feedType?: 'global' | 'following' | 'trending';
  includeComments?: boolean;
}

/**
 * Hook for fetching and subscribing to live social feed
 */
export function useSocialFeed(options: SocialFeedOptions = {}) {
  const { limit = 20, feedType = 'global', includeComments = false } = options;
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const supabase = createClient();

  // Fetch posts
  const fetchPosts = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('social_posts')
        .select(`
          id,
          user_id,
          content,
          content_type,
          media_url,
          canvas_item_id,
          likes_count,
          comments_count,
          shares_count,
          created_at,
          updated_at,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply feed type filters
      if (feedType === 'trending') {
        query = query.order('likes_count', { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // Table might not exist yet - use mock data
        console.warn('Social posts table not ready:', fetchError.message);
        setPosts(getMockPosts());
        setError(null);
        return;
      }

      if (data) {
        const formattedPosts: SocialPost[] = data.map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          user_name: post.profiles?.full_name || 'Anonim Kullanıcı',
          user_avatar: post.profiles?.avatar_url,
          content: post.content,
          content_type: post.content_type || 'text',
          media_url: post.media_url,
          canvas_item_id: post.canvas_item_id,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          shares_count: post.shares_count || 0,
          created_at: post.created_at,
          updated_at: post.updated_at,
        }));

        if (offset === 0) {
          setPosts(formattedPosts);
        } else {
          setPosts(prev => [...prev, ...formattedPosts]);
        }

        setHasMore(data.length === limit);
      }
    } catch (err) {
      console.error('Failed to fetch social feed:', err);
      setPosts(getMockPosts());
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, limit, feedType]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchPosts();

    // Subscribe to new posts
    let channel: RealtimeChannel | null = null;
    
    try {
      channel = supabase
        .channel('social_feed_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'social_posts',
          },
          (payload) => {
            console.log('🔔 New social post:', payload);
            // Add new post to top of feed
            const newPost = payload.new as any;
            setPosts(prev => [{
              id: newPost.id,
              user_id: newPost.user_id,
              user_name: 'Yeni Kullanıcı',
              content: newPost.content,
              content_type: newPost.content_type || 'text',
              media_url: newPost.media_url,
              canvas_item_id: newPost.canvas_item_id,
              likes_count: 0,
              comments_count: 0,
              shares_count: 0,
              created_at: newPost.created_at,
              updated_at: newPost.updated_at,
            }, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'social_posts',
          },
          (payload) => {
            console.log('📝 Post updated:', payload);
            const updated = payload.new as any;
            setPosts(prev => prev.map(post => 
              post.id === updated.id
                ? { ...post, ...updated }
                : post
            ));
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription failed:', err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchPosts, supabase]);

  // Load more posts
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(posts.length);
    }
  }, [loading, hasMore, posts.length, fetchPosts]);

  // Refresh feed
  const refresh = useCallback(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * Hook for posting to social feed
 */
export function useSocialActions() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Like a post
  const likePost = useCallback(async (postId: string, userId: string) => {
    try {
      setLoading(true);
      
      // Check if already liked
      const { data: existing } = await supabase
        .from('social_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Unlike
        await supabase.from('social_likes').delete().eq('id', existing.id);
        await supabase.rpc('decrement_likes', { post_id: postId });
        return { liked: false };
      } else {
        // Like
        await supabase.from('social_likes').insert({ post_id: postId, user_id: userId });
        await supabase.rpc('increment_likes', { post_id: postId });
        return { liked: true };
      }
    } catch (err) {
      console.error('Failed to like post:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Comment on a post
  const commentOnPost = useCallback(async (
    postId: string,
    userId: string,
    userName: string,
    content: string
  ) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('social_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          user_name: userName,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment comment count
      await supabase.rpc('increment_comments', { post_id: postId });

      return data;
    } catch (err) {
      console.error('Failed to comment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Share canvas item to social feed
  const shareCanvasItem = useCallback(async (
    userId: string,
    userName: string,
    canvasItemId: string,
    content: string,
    mediaUrl?: string
  ) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: userId,
          content,
          content_type: 'canvas_share',
          canvas_item_id: canvasItemId,
          media_url: mediaUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to share canvas item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Create a new post
  const createPost = useCallback(async (
    userId: string,
    content: string,
    contentType: SocialPost['content_type'] = 'text',
    mediaUrl?: string
  ) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: userId,
          content,
          content_type: contentType,
          media_url: mediaUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to create post:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    loading,
    likePost,
    commentOnPost,
    shareCanvasItem,
    createPost,
  };
}

/**
 * Hook for fetching comments on a post
 */
export function usePostComments(postId: string) {
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('social_comments')
          .select(`
            id,
            post_id,
            user_id,
            user_name,
            content,
            likes_count,
            created_at,
            profiles:user_id (
              avatar_url
            )
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('Comments fetch failed:', error.message);
          return;
        }

        if (data) {
          setComments(data.map((c: any) => ({
            ...c,
            user_avatar: c.profiles?.avatar_url,
          })));
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments_${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          setComments(prev => [...prev, payload.new as SocialComment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, supabase]);

  return { comments, loading };
}

// Mock posts for when database isn't ready
function getMockPosts(): SocialPost[] {
  const now = new Date();
  return [
    {
      id: 'mock-1',
      user_id: 'user-1',
      user_name: 'Ahmet Yılmaz',
      user_avatar: undefined,
      content: 'Harika bir koleksiyon hazırladım! 🎉 Canvas üzerinde en sevdiğim videoları düzenledim.',
      content_type: 'text',
      likes_count: 24,
      comments_count: 5,
      shares_count: 2,
      created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-2',
      user_id: 'user-2',
      user_name: 'Elif Kaya',
      user_avatar: undefined,
      content: 'Lo-Fi müzik dinlerken çalışmak çok verimli oluyor. Herkese tavsiye ederim! 🎵',
      content_type: 'text',
      likes_count: 18,
      comments_count: 3,
      shares_count: 1,
      created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-3',
      user_id: 'user-3',
      user_name: 'Mehmet Demir',
      user_avatar: undefined,
      content: 'Doğa belgeselleri bölümünü keşfettim, muhteşem içerikler var! 🌍',
      content_type: 'text',
      likes_count: 32,
      comments_count: 8,
      shares_count: 4,
      created_at: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-4',
      user_id: 'user-4',
      user_name: 'Zeynep Arslan',
      user_avatar: undefined,
      content: 'Tasarım kaynakları harika! Dribbble ve Behance koleksiyonları tam aradığım şeydi. 👍',
      content_type: 'text',
      likes_count: 15,
      comments_count: 2,
      shares_count: 0,
      created_at: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-5',
      user_id: 'user-5',
      user_name: 'Can Yıldırım',
      user_avatar: undefined,
      content: 'React kodlama dersleri süper! Yeni başlayanlar için mükemmel kaynak. 💻',
      content_type: 'text',
      likes_count: 45,
      comments_count: 12,
      shares_count: 6,
      created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-6',
      user_id: 'user-6',
      user_name: 'Selin Öztürk',
      user_avatar: undefined,
      content: 'Yoga ve meditasyon videoları stres atmak için harika. Herkese öneririm! 🧘‍♀️',
      content_type: 'text',
      likes_count: 28,
      comments_count: 6,
      shares_count: 3,
      created_at: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-7',
      user_id: 'user-7',
      user_name: 'Burak Şahin',
      user_avatar: undefined,
      content: 'Seyahat belgeselleri izleyip dünyayı keşfediyorum. Avrupa turu videosu muhteşem! ✈️',
      content_type: 'text',
      likes_count: 21,
      comments_count: 4,
      shares_count: 2,
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-8',
      user_id: 'user-8',
      user_name: 'Ayşe Çelik',
      user_avatar: undefined,
      content: 'Fitness antrenman videoları gerçekten motive edici! Evde spor yapmak çok kolay. 💪',
      content_type: 'text',
      likes_count: 38,
      comments_count: 9,
      shares_count: 5,
      created_at: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
    },
  ];
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'şimdi';
  if (diffMins < 60) return `${diffMins} dk önce`;
  if (diffHours < 24) return `${diffHours} sa önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  
  return date.toLocaleDateString('tr-TR');
}
