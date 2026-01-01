/**
 * Reward System Integration
 * 
 * Handles:
 * - Achievement unlocking
 * - Notification sending
 * - Reward tracking
 * - Badge distribution
 */

import { createClient } from '@/lib/supabase/client';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'referral' | 'social' | 'content' | 'milestone';
  points: number;
  requirement?: Record<string, any>;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
  isCompleted: boolean;
}

// Predefined referral achievements
export const REFERRAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'referrer_first',
    name: 'İlk Davet',
    description: 'İlk arkadaşını davet ettin!',
    icon: '🎯',
    category: 'referral',
    points: 50
  },
  {
    id: 'referrer_5',
    name: 'Davetiye Ustası',
    description: '5 arkadaşını davet ettin!',
    icon: '🌟',
    category: 'referral',
    points: 250
  },
  {
    id: 'referrer_10',
    name: 'Topluluk Lideri',
    description: '10 arkadaşını davet ettin!',
    icon: '👑',
    category: 'referral',
    points: 500
  },
  {
    id: 'referrer_complete',
    name: 'Tam Davetiye',
    description: 'Davet ettiğin arkadaş tüm adımları tamamladı!',
    icon: '✨',
    category: 'referral',
    points: 100
  },
  {
    id: 'referee_welcome',
    name: 'Hoş Geldin',
    description: 'Davet ile katıldın!',
    icon: '👋',
    category: 'referral',
    points: 25
  },
  {
    id: 'referee_verified',
    name: 'Doğrulanmış Üye',
    description: 'E-postanı doğruladın!',
    icon: '✅',
    category: 'referral',
    points: 50
  }
];

/**
 * Unlock achievement for user
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Check if already unlocked
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();
    
    if (existing) {
      console.log('Achievement already unlocked');
      return false;
    }
    
    // Unlock achievement
    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
        progress: 100,
        is_completed: true
      });
    
    if (error) throw error;
    
    // Send notification
    const achievement = REFERRAL_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (achievement) {
      await sendNotification(userId, {
        type: 'achievement',
        title: `🏆 Başarım Açıldı: ${achievement.name}`,
        message: achievement.description,
        points: achievement.points
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return false;
  }
}

/**
 * Check and unlock referral-based achievements
 */
export async function checkReferralAchievements(userId: string): Promise<void> {
  try {
    const supabase = createClient();
    
    // Get referral count
    const { data: referrals } = await supabase
      .from('user_referrals')
      .select('referee_verified')
      .eq('referrer_id', userId);
    
    const totalReferrals = referrals?.length || 0;
    const verifiedReferrals = referrals?.filter(r => r.referee_verified).length || 0;
    
    // Check milestones
    if (totalReferrals >= 1) {
      await unlockAchievement(userId, 'referrer_first');
    }
    if (totalReferrals >= 5) {
      await unlockAchievement(userId, 'referrer_5');
    }
    if (totalReferrals >= 10) {
      await unlockAchievement(userId, 'referrer_10');
    }
  } catch (error) {
    console.error('Error checking referral achievements:', error);
  }
}

/**
 * Send notification to user
 */
export async function sendNotification(
  userId: string,
  notification: {
    type: 'achievement' | 'referral' | 'reward' | 'system';
    title: string;
    message: string;
    points?: number;
    metadata?: Record<string, any>;
  }
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: {
          points: notification.points,
          ...notification.metadata
        },
        is_read: false,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Get user's total points
 */
export async function getUserPoints(userId: string): Promise<number> {
  try {
    const supabase = createClient();
    
    // Sum points from achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .eq('is_completed', true);
    
    const achievementPoints = achievements?.reduce((total, ua) => {
      const achievement = REFERRAL_ACHIEVEMENTS.find(a => a.id === ua.achievement_id);
      return total + (achievement?.points || 0);
    }, 0) || 0;
    
    // Sum points from rewards
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('reward_value')
      .eq('user_id', userId)
      .eq('is_claimed', true);
    
    const rewardPoints = rewards?.reduce((total, reward) => {
      return total + (reward.reward_value.points || 0);
    }, 0) || 0;
    
    return achievementPoints + rewardPoints;
  } catch (error) {
    console.error('Error getting user points:', error);
    return 0;
  }
}

/**
 * Get user's achievement progress
 */
export async function getAchievementProgress(userId: string): Promise<{
  total: number;
  unlocked: number;
  percentage: number;
  achievements: UserAchievement[];
}> {
  try {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);
    
    const unlocked = data?.filter(a => a.is_completed).length || 0;
    const total = REFERRAL_ACHIEVEMENTS.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    
    return {
      total,
      unlocked,
      percentage,
      achievements: data || []
    };
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    return { total: 0, unlocked: 0, percentage: 0, achievements: [] };
  }
}
