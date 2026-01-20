/**
 * Achievement & Rewards System Types
 * Ödül, rozet ve başarı sistemi tipleri
 */

export type AchievementCategory = 'general' | 'referral' | 'social' | 'milestone' | 'special';
export type RewardType = 'storage' | 'premium_days' | 'feature_unlock' | 'badge';
export type TransactionType = 'earned' | 'claimed' | 'expired' | 'revoked';

export interface AchievementDefinition {
  id: string;
  achievement_key: string;
  title: string;
  description?: string;
  icon?: string;
  badge_image_url?: string;
  category: AchievementCategory;
  reward_type?: RewardType;
  reward_amount?: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  achievement_def_id?: string;
  
  // Referrer/Source tracking
  referrer_id?: string;
  referrer_username?: string;
  referrer_avatar_url?: string;
  organization_id?: string;
  organization_name?: string;
  organization_logo_url?: string;
  
  // Display settings
  show_referrer: boolean;
  show_organization: boolean;
  
  // Double hash tracking
  referrer_hash?: string;
  timestamp_hash?: string;
  
  // Reward details
  reward_claimed: boolean;
  reward_claimed_at?: string;
  reward_type?: RewardType;
  reward_amount?: number;
  
  // Metadata
  metadata: Record<string, any>;
  earned_at: string;
  
  // Joined data
  achievement?: AchievementDefinition;
}

export interface AchievementProgress {
  id: string;
  user_id: string;
  achievement_key: string;
  current_progress: number;
  target_progress: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RewardTransaction {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  reward_source?: string;
  achievement_id?: string;
  reward_type?: RewardType;
  reward_amount?: number;
  previous_balance?: number;
  new_balance?: number;
  expires_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AchievementSummary {
  user_id: string;
  total_achievements: number;
  unclaimed_rewards: number;
  total_storage_earned: number;
  total_premium_days_earned: number;
  recent_achievements: Array<{
    achievement_key: string;
    earned_at: string;
    icon?: string;
    title: string;
  }>;
}

export interface AchievementCardSettings {
  showReferrer: boolean;
  showOrganization: boolean;
  cardStyle: 'compact' | 'detailed' | 'minimal';
}

// UI specific types
export interface AchievementNotification {
  achievement: UserAchievement;
  definition: AchievementDefinition;
  isNew: boolean;
}

export interface RewardBalance {
  storage_bytes: number;
  premium_days: number;
  unlocked_features: string[];
  badges: string[];
}
