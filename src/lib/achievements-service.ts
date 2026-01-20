/**
 * Achievement Service
 * Ödül sistemi işlemleri
 */

import { createClient } from './supabase/client';
import type {
  AchievementDefinition,
  UserAchievement,
  AchievementProgress,
  RewardTransaction,
  AchievementSummary,
  RewardBalance,
} from './achievements-types';

export class AchievementService {
  private supabase = createClient();

  /**
   * Get all active achievement definitions
   */
  async getAchievementDefinitions(): Promise<AchievementDefinition[]> {
    const { data, error } = await this.supabase
      .from('achievement_definitions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch achievement definitions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's achievements with full details
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievement_definitions(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch user achievements:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's achievement summary
   */
  async getAchievementSummary(userId: string): Promise<AchievementSummary | null> {
    const { data, error } = await this.supabase
      .from('user_achievements_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch achievement summary:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user's reward balance
   */
  async getRewardBalance(userId: string): Promise<RewardBalance> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('reward_type, reward_amount, reward_claimed')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch reward balance:', error);
      return {
        storage_bytes: 0,
        premium_days: 0,
        unlocked_features: [],
        badges: [],
      };
    }

    const balance: RewardBalance = {
      storage_bytes: 0,
      premium_days: 0,
      unlocked_features: [],
      badges: [],
    };

    data?.forEach((achievement) => {
      if (!achievement.reward_claimed && achievement.reward_amount) {
        if (achievement.reward_type === 'storage') {
          balance.storage_bytes += achievement.reward_amount * 1024 * 1024; // MB to bytes
        } else if (achievement.reward_type === 'premium_days') {
          balance.premium_days += achievement.reward_amount;
        } else if (achievement.reward_type === 'feature_unlock') {
          balance.unlocked_features.push(achievement.achievement_key);
        } else if (achievement.reward_type === 'badge') {
          balance.badges.push(achievement.achievement_key);
        }
      }
    });

    return balance;
  }

  /**
   * Update achievement display settings
   */
  async updateAchievementSettings(
    achievementId: string,
    settings: {
      show_referrer?: boolean;
      show_organization?: boolean;
    }
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_achievements')
      .update(settings)
      .eq('id', achievementId);

    if (error) {
      console.error('Failed to update achievement settings:', error);
      return false;
    }

    return true;
  }

  /**
   * Claim reward from achievement
   */
  async claimReward(achievementId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_achievements')
      .update({
        reward_claimed: true,
        reward_claimed_at: new Date().toISOString(),
      })
      .eq('id', achievementId);

    if (error) {
      console.error('Failed to claim reward:', error);
      return false;
    }

    return true;
  }

  /**
   * Get achievement progress for specific achievement
   */
  async getAchievementProgress(
    userId: string,
    achievementKey: string
  ): Promise<AchievementProgress | null> {
    const { data, error } = await this.supabase
      .from('achievement_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_key', achievementKey)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Update achievement progress
   */
  async updateProgress(
    userId: string,
    achievementKey: string,
    currentProgress: number,
    targetProgress: number
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('achievement_progress')
      .upsert({
        user_id: userId,
        achievement_key: achievementKey,
        current_progress: currentProgress,
        target_progress: targetProgress,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to update achievement progress:', error);
      return false;
    }

    return true;
  }

  /**
   * Get reward transactions history
   */
  async getRewardTransactions(userId: string, limit = 50): Promise<RewardTransaction[]> {
    const { data, error } = await this.supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch reward transactions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get achievement leaderboard
   */
  async getAchievementLeaderboard(limit = 100): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('achievement_leaderboard')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Failed to fetch achievement leaderboard:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Manually grant achievement (for testing or admin)
   */
  async grantAchievement(
    userId: string,
    achievementKey: string,
    referrerId?: string,
    organizationId?: string
  ): Promise<string | null> {
    const { data, error } = await this.supabase.rpc('grant_achievement', {
      p_user_id: userId,
      p_achievement_key: achievementKey,
      p_referrer_id: referrerId || null,
      p_organization_id: organizationId || null,
    });

    if (error) {
      console.error('Failed to grant achievement:', error);
      return null;
    }

    return data;
  }

  /**
   * Check and auto-grant achievements based on user activity
   */
  async checkAndGrantAchievements(userId: string): Promise<void> {
    // This would be called periodically or after specific actions
    // For example, after creating 10 videos, check for "content_creator" achievement
    
    // Example: Check first canvas creation
    const { data: canvasCount } = await this.supabase
      .from('canvas_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'canvas');

    // @ts-ignore - count is available but TS doesn't recognize it
    if (canvasCount === 1) {
      await this.grantAchievement(userId, 'first_canvas');
    }
  }
}

export const achievementService = new AchievementService();
