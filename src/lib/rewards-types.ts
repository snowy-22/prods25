/**
 * Achievements, Coupons, Referrals & Rewards System Types
 * Complete gamification and rewards system
 */

// ============================================================================
// ACHIEVEMENTS SYSTEM
// ============================================================================

export type AchievementCategory = 'account' | 'social' | 'commerce' | 'engagement' | 'content';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RequirementType = 'count' | 'milestone' | 'unique' | 'streak';
export type RewardType = 'coupon' | 'badge' | 'points' | 'unlock' | 'feature';

export interface AchievementDefinition {
  id: string;
  code: string;
  title: string;
  description?: string;
  category: AchievementCategory;
  icon?: string;
  badgeImageUrl?: string;
  
  // Requirements
  requirementType: RequirementType;
  requirementTarget: number;
  requirementField?: string;
  
  // Rewards
  rewardType?: RewardType;
  rewardValue: number;
  rewardCouponTemplateId?: string;
  
  // Display
  displayOrder: number;
  isHidden: boolean;
  isActive: boolean;
  rarity: AchievementRarity;
  
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  
  // Progress
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: string;
  
  // Verification
  verificationHash?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  
  // Reward
  rewardClaimed: boolean;
  rewardClaimedAt?: string;
  rewardCouponId?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Joined data
  achievement?: AchievementDefinition;
}

export interface AchievementEvent {
  id: string;
  userId: string;
  achievementId: string;
  
  eventType: 'progress' | 'complete' | 'claim' | 'verify';
  eventData: Record<string, any>;
  previousProgress: number;
  newProgress: number;
  
  // Verification chain
  previousEventHash?: string;
  eventHash: string;
  
  createdAt: string;
}

// Achievement card for UI
export interface AchievementCard {
  id: string;
  code: string;
  title: string;
  description?: string;
  icon?: string;
  badgeImageUrl?: string;
  iconUrl?: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  
  // Progress
  currentProgress: number;
  targetProgress: number;
  targetValue?: number;
  progressPercent: number;
  isCompleted: boolean;
  isClaimed?: boolean;
  completedAt?: string;
  
  // Reward
  rewardType?: RewardType;
  rewardValue?: number;
  rewardClaimed: boolean;
  canClaimReward: boolean;
  
  // UI State
  isNew: boolean;
  isLocked: boolean;
}

// ============================================================================
// COUPONS SYSTEM
// ============================================================================

export type DiscountType = 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
export type CouponStatus = 'active' | 'used' | 'expired' | 'revoked';
export type CouponSourceType = 'system' | 'achievement' | 'referral' | 'promotion' | 'manual';

export interface CouponTemplate {
  id: string;
  codePrefix?: string;
  title: string;
  description?: string;
  
  // Discount
  discountType: DiscountType;
  discountValue: number;
  minimumPurchase: number;
  maximumDiscount?: number;
  
  // Applicability
  appliesTo: 'all' | 'category' | 'product' | 'seller';
  applicableIds?: string[];
  
  // Validity
  validDays: number;
  maxUsagePerUser: number;
  maxTotalUsage?: number;
  
  // Source
  sourceType: CouponSourceType;
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCoupon {
  id: string;
  userId: string;
  templateId: string;
  
  code: string;
  status: CouponStatus;
  
  usageCount: number;
  maxUsage: number;
  
  issuedAt: string;
  expiresAt: string;
  
  usedAt?: string;
  usedOrderId?: string;
  discountApplied?: number;
  
  sourceType?: CouponSourceType;
  sourceId?: string;
  
  verificationHash?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Joined data
  template?: CouponTemplate;
}

// Coupon card for UI
export interface CouponCard {
  id: string;
  code: string;
  title: string;
  description?: string;
  
  discountType: DiscountType;
  discountValue: number;
  discountDisplay: string; // e.g., "%10 İndirim" or "25₺ İndirim"
  
  minimumPurchase: number;
  minimumPurchaseDisplay: string;
  minPurchase?: number; // Alias for minimumPurchase (used in coupon-card.tsx)
  maxDiscount?: number; // Maximum discount amount (used in coupon-card.tsx)
  
  status: CouponStatus;
  statusDisplay: string;
  
  expiresAt: string;
  expiresIn: string; // e.g., "3 gün kaldı"
  isExpiringSoon: boolean;
  
  sourceType?: CouponSourceType;
  sourceDisplay?: string;
  source?: CouponSourceType; // Alias for sourceType (used in coupon-card.tsx)
  
  usedAt?: string; // When the coupon was used (used in coupon-card.tsx)
  
  canUse: boolean;
}

// ============================================================================
// REFERRAL SYSTEM
// ============================================================================

export type ReferralStatus = 'pending' | 'registered' | 'qualified' | 'rewarded';
export type QualificationType = 'registration' | 'first_purchase' | 'subscription';
export type ReferralRewardType = 'coupon' | 'credit' | 'points';

export interface Referral {
  id: string;
  referrerId: string;
  referredId?: string;
  referralCode: string;
  
  status: ReferralStatus;
  
  qualificationType: QualificationType;
  qualificationMet: boolean;
  qualificationMetAt?: string;
  qualificationData: Record<string, any>;
  
  // Referrer reward
  referrerRewardType?: ReferralRewardType;
  referrerRewardValue: number;
  referrerRewardClaimed: boolean;
  referrerRewardClaimedAt?: string;
  referrerCouponId?: string;
  
  // Referred reward
  referredRewardType?: ReferralRewardType;
  referredRewardValue: number;
  referredRewardClaimed: boolean;
  referredRewardClaimedAt?: string;
  referredCouponId?: string;
  
  verificationHash?: string;
  previousReferralHash?: string;
  
  createdAt: string;
  registeredAt?: string;
  updatedAt: string;
  
  // Joined data
  referredUser?: {
    id: string;
    fullName?: string;
    avatarUrl?: string;
    createdAt: string;
  };
}

export interface ReferrerTier {
  id: string;
  name: string;
  minReferrals: number;
  maxReferrals?: number;
  
  registrationBonus: number;
  purchaseCommissionRate: number;
  subscriptionCommissionRate: number;
  
  perks: string[];
  badgeIcon?: string;
  
  createdAt: string;
}

export interface UserReferrerStatus {
  id: string;
  userId: string;
  
  isActiveReferrer: boolean;
  referralCode: string;
  
  tierId?: string;
  tier?: ReferrerTier;
  
  totalReferrals: number;
  qualifiedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  
  payoutMethod?: 'bank' | 'paypal' | 'credit';
  payoutDetails: Record<string, any>;
  minimumPayout: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface ReferralEarning {
  id: string;
  referrerId: string;
  referralId: string;
  
  earningType: 'registration' | 'purchase' | 'subscription';
  amount: number;
  currency: string;
  
  sourceOrderId?: string;
  sourceSubscriptionId?: string;
  commissionRate?: number;
  
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  
  payoutId?: string;
  paidAt?: string;
  
  verificationHash?: string;
  
  createdAt: string;
}

// Referral link info for sharing
export interface ReferralLinkInfo {
  code: string;
  url: string;
  qrCodeUrl: string;
  
  stats: {
    totalClicks: number;
    totalSignups: number;
    conversionRate: number;
  };
}

// ============================================================================
// POINTS & REWARDS SYSTEM
// ============================================================================

export type PointsTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type PointsTransactionType = 'earn' | 'spend' | 'expire' | 'adjust';
export type PointsSourceType = 'achievement' | 'purchase' | 'review' | 'referral' | 'promotion';

export interface UserPoints {
  id: string;
  userId: string;
  
  totalPoints: number;
  availablePoints: number;
  spentPoints: number;
  expiredPoints: number;
  
  tier: PointsTier;
  tierPoints: number;
  nextTierPoints: number;
  tierProgress: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  
  transactionType: PointsTransactionType;
  points: number;
  balanceAfter: number;
  
  sourceType?: PointsSourceType;
  sourceId?: string;
  description?: string;
  
  expiresAt?: string;
  expired: boolean;
  
  verificationHash?: string;
  
  createdAt: string;
}

// ============================================================================
// AGGREGATED TYPES FOR UI
// ============================================================================

// Profile rewards summary
export interface ProfileRewardsSummary {
  // Points
  points: {
    available: number;
    tier: PointsTier;
    tierProgress: number;
  };
  
  // Coupons
  coupons: {
    active: number;
    expiringSoon: number;
    totalSavings: number;
  };
  
  // Achievements
  achievements: {
    completed: number;
    total: number;
    recentlyUnlocked: AchievementCard[];
  };
  
  // Referrals
  referrals: {
    isReferrer: boolean;
    code?: string;
    totalReferrals: number;
    earnings: number;
    pendingEarnings: number;
  };
}

// Full rewards dashboard
export interface RewardsDashboard {
  points: UserPoints;
  coupons: CouponCard[];
  achievements: AchievementCard[];
  referrerStatus?: UserReferrerStatus;
  referrals: Referral[];
  recentEarnings: ReferralEarning[];
  recentTransactions: PointsTransaction[];
}

// ============================================================================
// EVENT TYPES FOR REALTIME
// ============================================================================

export type RewardsEventType = 
  | 'achievement_progress'
  | 'achievement_completed'
  | 'achievement_claimed'
  | 'coupon_issued'
  | 'coupon_used'
  | 'coupon_expired'
  | 'referral_signup'
  | 'referral_qualified'
  | 'referral_rewarded'
  | 'points_earned'
  | 'points_spent'
  | 'tier_upgraded';

export interface RewardsEvent {
  type: RewardsEventType;
  userId: string;
  data: Record<string, any>;
  timestamp: string;
}
