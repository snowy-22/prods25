/**
 * Profile & Feed Service
 * 
 * Profil tuvali, sosyal akış, etkileşimler ve realtime güncellemeler için servis.
 * Supabase ile entegre çalışır.
 */

import { createClient } from '@/lib/supabase/client';
import { ContentItem } from '@/lib/initial-content';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types
export interface ProfileCanvas {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  theme: 'light' | 'dark' | 'system' | 'custom';
  custom_theme?: Record<string, string>;
  layout: 'grid' | 'masonry' | 'list' | 'canvas';
  visibility: 'public' | 'private' | 'followers-only';
  featured_items: string[];
  pinned_items: string[];
  social_links: Array<{ platform: string; url: string; icon?: string }>;
  stats: {
    followers: number;
    following: number;
    posts: number;
    total_views: number;
    total_likes: number;
  };
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  item_data: ContentItem;
  title: string;
  description?: string;
  visibility: 'public' | 'private' | 'followers-only' | 'unlisted';
  category?: string;
  tags: string[];
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  save_count: number;
  average_rating?: number;
  rating_count: number;
  is_featured: boolean;
  is_trending: boolean;
  trending_score: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface FeedInteraction {
  id: string;
  user_id: string;
  feed_item_id: string;
  interaction_type: 'like' | 'save' | 'share' | 'view';
  created_at: string;
}

export interface FeedComment {
  id: string;
  user_id: string;
  feed_item_id: string;
  parent_comment_id?: string;
  content: string;
  like_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    display_name: string;
    avatar_url?: string;
  };
  replies?: FeedComment[];
}

export interface FeedRating {
  id: string;
  user_id: string;
  feed_item_id: string;
  rating: number;
  review?: string;
  created_at: string;
}

export interface Poll {
  id: string;
  user_id: string;
  question: string;
  options: Array<{ id: string; text: string; votes: number }>;
  allow_multiple: boolean;
  show_results_before_vote: boolean;
  is_anonymous: boolean;
  ends_at?: string;
  total_votes: number;
  created_at: string;
  updated_at: string;
}

export interface SocialFollower {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

// Service class
class ProfileFeedService {
  private supabase = createClient();
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  // ==================== Profile Canvas ====================

  async getProfileCanvas(userId: string): Promise<ProfileCanvas | null> {
    const { data, error } = await this.supabase
      .from('profile_canvas')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile canvas:', error);
      return null;
    }

    return data;
  }

  async getProfileBySlug(slug: string): Promise<ProfileCanvas | null> {
    const { data, error } = await this.supabase
      .from('profile_canvas')
      .select('*')
      .eq('slug', slug)
      .eq('visibility', 'public')
      .single();

    if (error) {
      console.error('Error fetching profile by slug:', error);
      return null;
    }

    return data;
  }

  async createProfileCanvas(
    userId: string,
    displayName: string,
    slug?: string
  ): Promise<ProfileCanvas | null> {
    const profileSlug = slug || displayName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const { data, error } = await this.supabase
      .from('profile_canvas')
      .insert({
        user_id: userId,
        slug: profileSlug,
        display_name: displayName,
        theme: 'system',
        layout: 'grid',
        visibility: 'public',
        featured_items: [],
        pinned_items: [],
        social_links: [],
        stats: { followers: 0, following: 0, posts: 0, total_views: 0, total_likes: 0 },
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile canvas:', error);
      return null;
    }

    return data;
  }

  async updateProfileCanvas(
    userId: string,
    updates: Partial<ProfileCanvas>
  ): Promise<ProfileCanvas | null> {
    const { data, error } = await this.supabase
      .from('profile_canvas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile canvas:', error);
      return null;
    }

    return data;
  }

  // ==================== User Feed ====================

  async publishToFeed(
    userId: string,
    item: ContentItem,
    options: {
      title: string;
      description?: string;
      visibility?: 'public' | 'private' | 'followers-only' | 'unlisted';
      category?: string;
      tags?: string[];
    }
  ): Promise<FeedItem | null> {
    const { data, error } = await this.supabase
      .from('user_feed')
      .insert({
        user_id: userId,
        item_id: item.id,
        item_type: item.type,
        item_data: item,
        title: options.title,
        description: options.description,
        visibility: options.visibility || 'public',
        category: options.category,
        tags: options.tags || [],
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        view_count: 0,
        save_count: 0,
        rating_count: 0,
        is_featured: false,
        is_trending: false,
        trending_score: 0,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error publishing to feed:', error);
      return null;
    }

    // Update profile stats
    await this.supabase.rpc('increment_profile_stat', {
      p_user_id: userId,
      p_stat: 'posts',
      p_amount: 1,
    });

    return data;
  }

  async getFeedItems(options: {
    feedType: 'discover' | 'following' | 'trending' | 'user';
    userId?: string;
    targetUserId?: string;
    category?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'popular' | 'trending' | 'top-rated';
  }): Promise<FeedItem[]> {
    let query = this.supabase
      .from('user_feed')
      .select('*, profile_canvas!user_feed_user_id_fkey(display_name, avatar_url, slug, is_verified)');

    // Apply filters based on feed type
    switch (options.feedType) {
      case 'discover':
        query = query.eq('visibility', 'public');
        break;
      case 'following':
        if (options.userId) {
          // Get following IDs first
          const { data: followingData } = await this.supabase
            .from('social_followers')
            .select('following_id')
            .eq('follower_id', options.userId)
            .eq('status', 'accepted');

          const followingIds = followingData?.map((f) => f.following_id) || [];
          if (followingIds.length > 0) {
            query = query.in('user_id', followingIds);
          } else {
            return [];
          }
        }
        break;
      case 'trending':
        query = query.eq('is_trending', true).eq('visibility', 'public');
        break;
      case 'user':
        if (options.targetUserId) {
          query = query.eq('user_id', options.targetUserId);
          // If not viewing own profile, only show public items
          if (options.userId !== options.targetUserId) {
            query = query.eq('visibility', 'public');
          }
        }
        break;
    }

    // Apply category filter
    if (options.category) {
      query = query.eq('category', options.category);
    }

    // Apply tags filter
    if (options.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    // Apply sorting
    switch (options.sortBy) {
      case 'popular':
        query = query.order('like_count', { ascending: false });
        break;
      case 'trending':
        query = query.order('trending_score', { ascending: false });
        break;
      case 'top-rated':
        query = query.order('average_rating', { ascending: false, nullsFirst: false });
        break;
      case 'recent':
      default:
        query = query.order('published_at', { ascending: false });
    }

    // Apply pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching feed items:', error);
      return [];
    }

    return data || [];
  }

  async deleteFeedItem(userId: string, feedItemId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_feed')
      .delete()
      .eq('id', feedItemId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting feed item:', error);
      return false;
    }

    return true;
  }

  // ==================== Interactions ====================

  async likeItem(userId: string, feedItemId: string): Promise<boolean> {
    // Check if already liked
    const { data: existing } = await this.supabase
      .from('feed_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('feed_item_id', feedItemId)
      .eq('interaction_type', 'like')
      .single();

    if (existing) {
      // Unlike
      await this.supabase
        .from('feed_interactions')
        .delete()
        .eq('id', existing.id);

      await this.supabase.rpc('increment_feed_stat', {
        p_feed_item_id: feedItemId,
        p_stat: 'like_count',
        p_amount: -1,
      });

      return false;
    } else {
      // Like
      await this.supabase.from('feed_interactions').insert({
        user_id: userId,
        feed_item_id: feedItemId,
        interaction_type: 'like',
      });

      await this.supabase.rpc('increment_feed_stat', {
        p_feed_item_id: feedItemId,
        p_stat: 'like_count',
        p_amount: 1,
      });

      return true;
    }
  }

  async saveItem(userId: string, feedItemId: string): Promise<boolean> {
    const { data: existing } = await this.supabase
      .from('feed_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('feed_item_id', feedItemId)
      .eq('interaction_type', 'save')
      .single();

    if (existing) {
      await this.supabase.from('feed_interactions').delete().eq('id', existing.id);
      return false;
    } else {
      await this.supabase.from('feed_interactions').insert({
        user_id: userId,
        feed_item_id: feedItemId,
        interaction_type: 'save',
      });
      return true;
    }
  }

  async shareItem(userId: string, feedItemId: string): Promise<void> {
    await this.supabase.from('feed_interactions').insert({
      user_id: userId,
      feed_item_id: feedItemId,
      interaction_type: 'share',
    });

    await this.supabase.rpc('increment_feed_stat', {
      p_feed_item_id: feedItemId,
      p_stat: 'share_count',
      p_amount: 1,
    });
  }

  async viewItem(userId: string, feedItemId: string): Promise<void> {
    // Only count one view per user per item per day
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await this.supabase
      .from('feed_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('feed_item_id', feedItemId)
      .eq('interaction_type', 'view')
      .gte('created_at', today)
      .single();

    if (!existing) {
      await this.supabase.from('feed_interactions').insert({
        user_id: userId,
        feed_item_id: feedItemId,
        interaction_type: 'view',
      });

      await this.supabase.rpc('increment_feed_stat', {
        p_feed_item_id: feedItemId,
        p_stat: 'view_count',
        p_amount: 1,
      });
    }
  }

  // ==================== Comments ====================

  async addComment(
    userId: string,
    feedItemId: string,
    content: string,
    parentCommentId?: string
  ): Promise<FeedComment | null> {
    const { data, error } = await this.supabase
      .from('feed_comments')
      .insert({
        user_id: userId,
        feed_item_id: feedItemId,
        parent_comment_id: parentCommentId,
        content,
        like_count: 0,
        is_edited: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }

    await this.supabase.rpc('increment_feed_stat', {
      p_feed_item_id: feedItemId,
      p_stat: 'comment_count',
      p_amount: 1,
    });

    return data;
  }

  async getComments(feedItemId: string, limit = 50): Promise<FeedComment[]> {
    const { data, error } = await this.supabase
      .from('feed_comments')
      .select('*, profile_canvas!feed_comments_user_id_fkey(display_name, avatar_url)')
      .eq('feed_item_id', feedItemId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: replies } = await this.supabase
          .from('feed_comments')
          .select('*, profile_canvas!feed_comments_user_id_fkey(display_name, avatar_url)')
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        return { ...comment, replies: replies || [] };
      })
    );

    return commentsWithReplies;
  }

  async deleteComment(userId: string, commentId: string): Promise<boolean> {
    // Get comment to find feed_item_id
    const { data: comment } = await this.supabase
      .from('feed_comments')
      .select('feed_item_id')
      .eq('id', commentId)
      .single();

    const { error } = await this.supabase
      .from('feed_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }

    if (comment) {
      await this.supabase.rpc('increment_feed_stat', {
        p_feed_item_id: comment.feed_item_id,
        p_stat: 'comment_count',
        p_amount: -1,
      });
    }

    return true;
  }

  // ==================== Ratings ====================

  async rateItem(
    userId: string,
    feedItemId: string,
    rating: number,
    review?: string
  ): Promise<FeedRating | null> {
    // Upsert rating
    const { data, error } = await this.supabase
      .from('feed_ratings')
      .upsert(
        {
          user_id: userId,
          feed_item_id: feedItemId,
          rating,
          review,
        },
        { onConflict: 'user_id,feed_item_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error rating item:', error);
      return null;
    }

    // Recalculate average rating
    await this.supabase.rpc('recalculate_feed_rating', {
      p_feed_item_id: feedItemId,
    });

    return data;
  }

  async getItemRatings(feedItemId: string): Promise<FeedRating[]> {
    const { data, error } = await this.supabase
      .from('feed_ratings')
      .select('*, profile_canvas!feed_ratings_user_id_fkey(display_name, avatar_url)')
      .eq('feed_item_id', feedItemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings:', error);
      return [];
    }

    return data || [];
  }

  // ==================== Following System ====================

  async followUser(followerId: string, followingId: string): Promise<boolean> {
    // Check if already following
    const { data: existing } = await this.supabase
      .from('social_followers')
      .select('id, status')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (existing) {
      if (existing.status === 'blocked') {
        return false;
      }
      // Unfollow
      await this.supabase.from('social_followers').delete().eq('id', existing.id);
      
      // Update stats
      await this.supabase.rpc('increment_profile_stat', {
        p_user_id: followerId,
        p_stat: 'following',
        p_amount: -1,
      });
      await this.supabase.rpc('increment_profile_stat', {
        p_user_id: followingId,
        p_stat: 'followers',
        p_amount: -1,
      });
      
      return false;
    } else {
      // Check target's visibility
      const { data: targetProfile } = await this.supabase
        .from('profile_canvas')
        .select('visibility')
        .eq('user_id', followingId)
        .single();

      const status = targetProfile?.visibility === 'private' ? 'pending' : 'accepted';

      await this.supabase.from('social_followers').insert({
        follower_id: followerId,
        following_id: followingId,
        status,
      });

      if (status === 'accepted') {
        await this.supabase.rpc('increment_profile_stat', {
          p_user_id: followerId,
          p_stat: 'following',
          p_amount: 1,
        });
        await this.supabase.rpc('increment_profile_stat', {
          p_user_id: followingId,
          p_stat: 'followers',
          p_amount: 1,
        });
      }

      return true;
    }
  }

  async getFollowers(userId: string, limit = 50): Promise<SocialFollower[]> {
    const { data, error } = await this.supabase
      .from('social_followers')
      .select('*, profile_canvas!social_followers_follower_id_fkey(display_name, avatar_url, slug)')
      .eq('following_id', userId)
      .eq('status', 'accepted')
      .limit(limit);

    if (error) {
      console.error('Error fetching followers:', error);
      return [];
    }

    return data || [];
  }

  async getFollowing(userId: string, limit = 50): Promise<SocialFollower[]> {
    const { data, error } = await this.supabase
      .from('social_followers')
      .select('*, profile_canvas!social_followers_following_id_fkey(display_name, avatar_url, slug)')
      .eq('follower_id', userId)
      .eq('status', 'accepted')
      .limit(limit);

    if (error) {
      console.error('Error fetching following:', error);
      return [];
    }

    return data || [];
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('social_followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .eq('status', 'accepted')
      .single();

    return !!data;
  }

  // ==================== Realtime Subscriptions ====================

  subscribeToFeed(
    userId: string,
    onUpdate: (payload: RealtimePostgresChangesPayload<FeedItem>) => void
  ): () => void {
    const channelKey = `feed-${userId}`;

    if (this.realtimeChannels.has(channelKey)) {
      this.realtimeChannels.get(channelKey)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_feed',
          filter: `visibility=eq.public`,
        },
        onUpdate
      )
      .subscribe();

    this.realtimeChannels.set(channelKey, channel);

    return () => {
      channel.unsubscribe();
      this.realtimeChannels.delete(channelKey);
    };
  }

  subscribeToProfileUpdates(
    userId: string,
    onUpdate: (payload: RealtimePostgresChangesPayload<ProfileCanvas>) => void
  ): () => void {
    const channelKey = `profile-${userId}`;

    if (this.realtimeChannels.has(channelKey)) {
      this.realtimeChannels.get(channelKey)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_canvas',
          filter: `user_id=eq.${userId}`,
        },
        onUpdate
      )
      .subscribe();

    this.realtimeChannels.set(channelKey, channel);

    return () => {
      channel.unsubscribe();
      this.realtimeChannels.delete(channelKey);
    };
  }

  subscribeToInteractions(
    feedItemId: string,
    onUpdate: (payload: any) => void
  ): () => void {
    const channelKey = `interactions-${feedItemId}`;

    if (this.realtimeChannels.has(channelKey)) {
      this.realtimeChannels.get(channelKey)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_interactions',
          filter: `feed_item_id=eq.${feedItemId}`,
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_comments',
          filter: `feed_item_id=eq.${feedItemId}`,
        },
        onUpdate
      )
      .subscribe();

    this.realtimeChannels.set(channelKey, channel);

    return () => {
      channel.unsubscribe();
      this.realtimeChannels.delete(channelKey);
    };
  }

  // Cleanup all subscriptions
  unsubscribeAll(): void {
    this.realtimeChannels.forEach((channel) => channel.unsubscribe());
    this.realtimeChannels.clear();
  }
}

// Export singleton instance
export const profileFeedService = new ProfileFeedService();
