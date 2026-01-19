/**
 * Likes & Reactions System
 * Handles likes on items, comments, posts, and various content
 */

import { createClient } from './supabase/client';

export type LikeableType = 
  | 'item'
  | 'comment'
  | 'post'
  | 'profile'
  | 'folder'
  | 'video'
  | 'collection';

export type Reaction = 
  | '👍' | '❤️' | '😂' | '😮' | '😢' | '😡'
  | '🔥' | '⭐' | '👏' | '🎉';

export interface Like {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  targetId: string;
  targetType: LikeableType;
  reaction?: Reaction;
  createdAt: string;
}

export interface LikeStats {
  targetId: string;
  targetType: LikeableType;
  totalLikes: number;
  totalReactions: number;
  reactionBreakdown: Record<Reaction, number>;
  recentLikes: Like[];
  userLiked?: boolean;
}

export interface UserLikeActivity {
  userId: string;
  userName: string;
  likeCount: number;
  favoriteTypes: LikeableType[];
  recentActivity: Like[];
}

/**
 * Likes Manager
 */
export class LikesManager {
  private supabase = createClient();

  /**
   * Toggle like on content
   */
  async toggleLike(
    userId: string,
    userName: string,
    targetId: string,
    targetType: LikeableType,
    userAvatar?: string,
    reaction?: Reaction
  ): Promise<{ liked: boolean; totalLikes: number }> {
    // Check if already liked
    const { data: existing } = await this.supabase
      .from('likes')
      .select('id')
      .eq('userId', userId)
      .eq('targetId', targetId)
      .eq('targetType', targetType)
      .single();

    if (existing) {
      // Unlike
      const { error } = await this.supabase
        .from('likes')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;

      // Update stats
      await this.updateLikeStats(targetId, targetType, -1);

      return { liked: false, totalLikes: await this.getLikeCount(targetId, targetType) };
    }

    // Like
    const now = new Date().toISOString();
    const { error } = await this.supabase
      .from('likes')
      .insert({
        userId,
        userName,
        userAvatar,
        targetId,
        targetType,
        reaction,
        createdAt: now
      });

    if (error) throw error;

    // Update stats
    await this.updateLikeStats(targetId, targetType, 1);

    return { liked: true, totalLikes: await this.getLikeCount(targetId, targetType) };
  }

  /**
   * Get like status for user
   */
  async getUserLike(
    userId: string,
    targetId: string,
    targetType: LikeableType
  ): Promise<Like | null> {
    const { data, error } = await this.supabase
      .from('likes')
      .select('*')
      .eq('userId', userId)
      .eq('targetId', targetId)
      .eq('targetType', targetType)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  /**
   * Get all likes for target
   */
  async getLikes(
    targetId: string,
    targetType: LikeableType,
    limit: number = 20
  ): Promise<Like[]> {
    const { data, error } = await this.supabase
      .from('likes')
      .select('*')
      .eq('targetId', targetId)
      .eq('targetType', targetType)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get like count
   */
  async getLikeCount(
    targetId: string,
    targetType: LikeableType
  ): Promise<number> {
    const { count, error } = await this.supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('targetId', targetId)
      .eq('targetType', targetType);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get like statistics
   */
  async getLikeStats(
    targetId: string,
    targetType: LikeableType,
    userId?: string
  ): Promise<LikeStats> {
    const { data: likes, error } = await this.supabase
      .from('likes')
      .select('*')
      .eq('targetId', targetId)
      .eq('targetType', targetType)
      .order('createdAt', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Calculate stats
    const reactionBreakdown: Record<Reaction, number> = {} as any;
    let totalReactions = 0;

    (likes || []).forEach((like: any) => {
      if (like.reaction) {
        (reactionBreakdown as any)[like.reaction] = ((reactionBreakdown as any)[like.reaction] || 0) + 1;
        totalReactions++;
      }
    });

    const userLiked = userId
      ? (likes || []).some(l => l.userId === userId)
      : undefined;

    return {
      targetId,
      targetType,
      totalLikes: likes?.length || 0,
      totalReactions,
      reactionBreakdown,
      recentLikes: (likes || []).slice(0, 5),
      userLiked
    };
  }

  /**
   * Get reactions breakdown
   */
  async getReactions(
    targetId: string,
    targetType: LikeableType
  ): Promise<Record<Reaction, number>> {
    const { data, error } = await this.supabase
      .from('likes')
      .select('reaction')
      .eq('targetId', targetId)
      .eq('targetType', targetType)
      .not('reaction', 'is', null);

    if (error) throw error;

    const breakdown: Record<Reaction, number> = {} as any;
    (data || []).forEach((like: any) => {
      if (like.reaction) {
        (breakdown as any)[like.reaction] = ((breakdown as any)[like.reaction] || 0) + 1;
      }
    });

    return breakdown;
  }

  /**
   * Add reaction to like
   */
  async addReaction(
    userId: string,
    targetId: string,
    targetType: LikeableType,
    reaction: Reaction
  ): Promise<Like> {
    const { data, error } = await this.supabase
      .from('likes')
      .update({ reaction })
      .eq('userId', userId)
      .eq('targetId', targetId)
      .eq('targetType', targetType)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    userId: string,
    limit: number = 50
  ): Promise<UserLikeActivity> {
    const { data: likes, error } = await this.supabase
      .from('likes')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get first like to get user name
    const firstLike = (likes || [])[0];
    const userName = firstLike?.userName || 'Unknown';

    // Calculate stats
    const typeCounts: Record<LikeableType, number> = {} as any;
    (likes || []).forEach((like: any) => {
      (typeCounts as any)[like.targetType] = ((typeCounts as any)[like.targetType] || 0) + 1;
    });

    const favoriteTypes = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type as LikeableType);

    return {
      userId,
      userName,
      likeCount: likes?.length || 0,
      favoriteTypes,
      recentActivity: (likes || []).slice(0, 10)
    };
  }

  /**
   * Get trending items
   */
  async getTrendingItems(
    targetType: LikeableType,
    timeframeHours: number = 24,
    limit: number = 10
  ): Promise<Array<{ targetId: string; likeCount: number }>> {
    const since = new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .rpc('get_trending_items', {
        target_type: targetType,
        since_date: since,
        limit_count: limit
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update like statistics
   */
  private async updateLikeStats(
    targetId: string,
    targetType: LikeableType,
    change: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('like_stats')
      .upsert({
        targetId,
        targetType,
        totalLikes: { increment: change }
      });

    if (error && error.code !== 'PGRST202') {
      console.error('Failed to update like stats:', error);
    }
  }

  /**
   * Subscribe to like changes
   */
  subscribeToLikes(
    targetId: string,
    targetType: LikeableType,
    callback: (like: Like | null) => void
  ) {
    return this.supabase
      .channel(`likes:${targetType}:${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `targetId=eq.${targetId}`
        },
        (payload) => {
          callback(payload.eventType === 'DELETE' ? null : (payload.new as Like));
        }
      )
      .subscribe();
  }
}

export const likesManager = new LikesManager();
