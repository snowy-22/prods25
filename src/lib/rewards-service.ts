/**
 * Rewards Service
 * Handles achievements, coupons, referrals, and points with Supabase
 */

import { createClient } from './supabase/client';
import {
  AchievementDefinition,
  UserAchievement,
  AchievementCard,
  CouponTemplate,
  UserCoupon,
  CouponCard,
  Referral,
  UserReferrerStatus,
  ReferralEarning,
  UserPoints,
  PointsTransaction,
  ProfileRewardsSummary,
  RewardsDashboard,
  ReferralLinkInfo,
} from './rewards-types';

const supabase = createClient();

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export async function getAchievementDefinitions(): Promise<AchievementDefinition[]> {
  const { data, error } = await supabase
    .from('achievement_definitions')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
  
  return data?.map(transformAchievementDefinition) || [];
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievement_definitions(*)
    `)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
  
  return data?.map(transformUserAchievement) || [];
}

export async function getAchievementCards(userId: string): Promise<AchievementCard[]> {
  const [definitions, userAchievements] = await Promise.all([
    getAchievementDefinitions(),
    getUserAchievements(userId),
  ]);
  
  const userMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));
  
  return definitions.map(def => {
    const userAch = userMap.get(def.id);
    const currentProgress = userAch?.currentProgress || 0;
    const progressPercent = Math.min(100, (currentProgress / def.requirementTarget) * 100);
    
    return {
      id: def.id,
      code: def.code,
      title: def.title,
      description: def.description,
      icon: def.icon,
      badgeImageUrl: def.badgeImageUrl,
      rarity: def.rarity,
      category: def.category,
      currentProgress,
      targetProgress: def.requirementTarget,
      progressPercent,
      isCompleted: userAch?.isCompleted || false,
      completedAt: userAch?.completedAt,
      rewardType: def.rewardType,
      rewardValue: def.rewardValue,
      rewardClaimed: userAch?.rewardClaimed || false,
      canClaimReward: (userAch?.isCompleted && !userAch?.rewardClaimed) || false,
      isNew: isNewAchievement(userAch?.completedAt),
      isLocked: def.isHidden && !userAch?.isCompleted,
    };
  });
}

export async function updateAchievementProgress(
  userId: string,
  achievementCode: string,
  incrementBy: number = 1
): Promise<UserAchievement | null> {
  // Get achievement definition
  const { data: def } = await supabase
    .from('achievement_definitions')
    .select('*')
    .eq('code', achievementCode)
    .single();
  
  if (!def) return null;
  
  // Get or create user achievement
  let { data: userAch } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .eq('achievement_id', def.id)
    .single();
  
  const previousProgress = userAch?.current_progress || 0;
  const newProgress = previousProgress + incrementBy;
  const isNowCompleted = newProgress >= def.requirement_target;
  
  if (userAch) {
    // Update existing
    const { data, error } = await supabase
      .from('user_achievements')
      .update({
        current_progress: newProgress,
        is_completed: isNowCompleted,
        completed_at: isNowCompleted && !userAch.is_completed ? new Date().toISOString() : userAch.completed_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userAch.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating achievement:', error);
      return null;
    }
    
    userAch = data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: def.id,
        current_progress: newProgress,
        is_completed: isNowCompleted,
        completed_at: isNowCompleted ? new Date().toISOString() : null,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating achievement:', error);
      return null;
    }
    
    userAch = data;
  }
  
  // Log event
  await supabase.from('achievement_events').insert({
    user_id: userId,
    achievement_id: def.id,
    event_type: isNowCompleted ? 'complete' : 'progress',
    previous_progress: previousProgress,
    new_progress: newProgress,
    event_data: { incrementBy },
  });
  
  return transformUserAchievement(userAch);
}

export async function claimAchievementReward(
  userId: string,
  achievementId: string
): Promise<{ success: boolean; couponId?: string; points?: number }> {
  const { data: userAch } = await supabase
    .from('user_achievements')
    .select('*, achievement:achievement_definitions(*)')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single();
  
  if (!userAch || !userAch.is_completed || userAch.reward_claimed) {
    return { success: false };
  }
  
  const achievement = userAch.achievement;
  let couponId: string | undefined;
  let points: number | undefined;
  
  // Issue reward based on type
  if (achievement.reward_type === 'coupon' && achievement.reward_coupon_template_id) {
    const coupon = await issueCoupon(userId, achievement.reward_coupon_template_id, 'achievement', achievementId);
    couponId = coupon?.id;
  } else if (achievement.reward_type === 'points') {
    await addPoints(userId, achievement.reward_value, 'achievement', achievementId, `${achievement.title} ödülü`);
    points = achievement.reward_value;
  }
  
  // Mark as claimed
  await supabase
    .from('user_achievements')
    .update({
      reward_claimed: true,
      reward_claimed_at: new Date().toISOString(),
      reward_coupon_id: couponId,
    })
    .eq('id', userAch.id);
  
  // Log event
  await supabase.from('achievement_events').insert({
    user_id: userId,
    achievement_id: achievementId,
    event_type: 'claim',
    new_progress: userAch.current_progress,
    previous_progress: userAch.current_progress,
    event_data: { couponId, points },
  });
  
  return { success: true, couponId, points };
}

// ============================================================================
// COUPONS
// ============================================================================

export async function getUserCoupons(userId: string): Promise<UserCoupon[]> {
  const { data, error } = await supabase
    .from('user_coupons')
    .select(`
      *,
      template:coupon_templates(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
  
  return data?.map(transformUserCoupon) || [];
}

export async function getCouponCards(userId: string): Promise<CouponCard[]> {
  const coupons = await getUserCoupons(userId);
  const now = new Date();
  
  return coupons.map(coupon => {
    const expiresAt = new Date(coupon.expiresAt);
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    
    let discountDisplay = '';
    if (coupon.template?.discountType === 'percentage') {
      discountDisplay = `%${coupon.template.discountValue} İndirim`;
    } else if (coupon.template?.discountType === 'fixed') {
      discountDisplay = `${coupon.template.discountValue}₺ İndirim`;
    } else if (coupon.template?.discountType === 'free_shipping') {
      discountDisplay = 'Ücretsiz Kargo';
    }
    
    let expiresIn = '';
    if (daysUntilExpiry <= 0) {
      expiresIn = 'Süresi doldu';
    } else if (daysUntilExpiry === 1) {
      expiresIn = '1 gün kaldı';
    } else {
      expiresIn = `${daysUntilExpiry} gün kaldı`;
    }
    
    const statusDisplay = {
      active: 'Aktif',
      used: 'Kullanıldı',
      expired: 'Süresi Doldu',
      revoked: 'İptal Edildi',
    }[coupon.status];
    
    const sourceDisplay = {
      achievement: 'Başarı Ödülü',
      referral: 'Referans Ödülü',
      promotion: 'Promosyon',
      system: 'Sistem',
      manual: 'Özel',
    }[coupon.sourceType || 'system'];
    
    return {
      id: coupon.id,
      code: coupon.code,
      title: coupon.template?.title || 'Kupon',
      description: coupon.template?.description,
      discountType: coupon.template?.discountType || 'percentage',
      discountValue: coupon.template?.discountValue || 0,
      discountDisplay,
      minimumPurchase: coupon.template?.minimumPurchase || 0,
      minimumPurchaseDisplay: coupon.template?.minimumPurchase 
        ? `Min. ${coupon.template.minimumPurchase}₺ alışveriş`
        : 'Minimum yok',
      status: coupon.status,
      statusDisplay,
      expiresAt: coupon.expiresAt,
      expiresIn,
      isExpiringSoon,
      sourceType: coupon.sourceType,
      sourceDisplay,
      canUse: coupon.status === 'active' && daysUntilExpiry > 0,
    };
  });
}

export async function issueCoupon(
  userId: string,
  templateId: string,
  sourceType: string,
  sourceId?: string
): Promise<UserCoupon | null> {
  const { data: template } = await supabase
    .from('coupon_templates')
    .select('*')
    .eq('id', templateId)
    .single();
  
  if (!template) return null;
  
  const code = generateCouponCode(template.code_prefix);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + template.valid_days);
  
  const { data, error } = await supabase
    .from('user_coupons')
    .insert({
      user_id: userId,
      template_id: templateId,
      code,
      status: 'active',
      max_usage: template.max_usage_per_user,
      expires_at: expiresAt.toISOString(),
      source_type: sourceType,
      source_id: sourceId,
    })
    .select('*, template:coupon_templates(*)')
    .single();
  
  if (error) {
    console.error('Error issuing coupon:', error);
    return null;
  }
  
  return transformUserCoupon(data);
}

export async function useCoupon(
  userId: string,
  couponCode: string,
  orderId: string,
  discountApplied: number
): Promise<boolean> {
  const { data: coupon } = await supabase
    .from('user_coupons')
    .select('*')
    .eq('user_id', userId)
    .eq('code', couponCode)
    .eq('status', 'active')
    .single();
  
  if (!coupon) return false;
  
  const newUsageCount = coupon.usage_count + 1;
  const newStatus = newUsageCount >= coupon.max_usage ? 'used' : 'active';
  
  const { error } = await supabase
    .from('user_coupons')
    .update({
      usage_count: newUsageCount,
      status: newStatus,
      used_at: new Date().toISOString(),
      used_order_id: orderId,
      discount_applied: discountApplied,
    })
    .eq('id', coupon.id);
  
  return !error;
}

export async function validateCoupon(
  userId: string,
  couponCode: string,
  orderTotal: number
): Promise<{ valid: boolean; discount?: number; error?: string }> {
  const { data: coupon } = await supabase
    .from('user_coupons')
    .select('*, template:coupon_templates(*)')
    .eq('user_id', userId)
    .eq('code', couponCode)
    .single();
  
  if (!coupon) {
    return { valid: false, error: 'Kupon bulunamadı' };
  }
  
  if (coupon.status !== 'active') {
    return { valid: false, error: 'Bu kupon artık geçerli değil' };
  }
  
  if (new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: 'Kuponun süresi dolmuş' };
  }
  
  const template = coupon.template;
  if (template.minimum_purchase && orderTotal < template.minimum_purchase) {
    return { valid: false, error: `Minimum ${template.minimum_purchase}₺ alışveriş gerekli` };
  }
  
  let discount = 0;
  if (template.discount_type === 'percentage') {
    discount = orderTotal * (template.discount_value / 100);
    if (template.maximum_discount && discount > template.maximum_discount) {
      discount = template.maximum_discount;
    }
  } else if (template.discount_type === 'fixed') {
    discount = template.discount_value;
  }
  
  return { valid: true, discount };
}

// ============================================================================
// REFERRALS
// ============================================================================

export async function getReferrerStatus(userId: string): Promise<UserReferrerStatus | null> {
  const { data, error } = await supabase
    .from('user_referrer_status')
    .select('*, tier:referrer_tiers(*)')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return transformUserReferrerStatus(data);
}

export async function becomeReferrer(userId: string): Promise<UserReferrerStatus | null> {
  // Get user's referral code from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single();
  
  if (!profile?.referral_code) {
    console.error('User has no referral code');
    return null;
  }
  
  // Get starter tier
  const { data: starterTier } = await supabase
    .from('referrer_tiers')
    .select('id')
    .eq('min_referrals', 0)
    .single();
  
  const { data, error } = await supabase
    .from('user_referrer_status')
    .insert({
      user_id: userId,
      is_active_referrer: true,
      referral_code: profile.referral_code,
      tier_id: starterTier?.id,
    })
    .select('*, tier:referrer_tiers(*)')
    .single();
  
  if (error) {
    console.error('Error becoming referrer:', error);
    return null;
  }
  
  // Update profile
  await supabase
    .from('profiles')
    .update({ is_referrer: true })
    .eq('id', userId);
  
  return transformUserReferrerStatus(data);
}

export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referred_user:profiles!referrals_referred_id_fkey(id, full_name, avatar_url, created_at)
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }
  
  return data?.map(transformReferral) || [];
}

export async function getReferralEarnings(userId: string): Promise<ReferralEarning[]> {
  const { data, error } = await supabase
    .from('referral_earnings')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching earnings:', error);
    return [];
  }
  
  return data?.map(transformReferralEarning) || [];
}

export async function getReferralLinkInfo(userId: string): Promise<ReferralLinkInfo | null> {
  const status = await getReferrerStatus(userId);
  if (!status) return null;
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tv25.app';
  const url = `${baseUrl}/auth?ref=${status.referralCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  
  // Get click stats (simplified)
  const referrals = await getUserReferrals(userId);
  
  return {
    code: status.referralCode,
    url,
    qrCodeUrl,
    stats: {
      totalClicks: status.totalReferrals * 3, // Estimate
      totalSignups: status.totalReferrals,
      conversionRate: 33, // Estimate
    },
  };
}

export async function trackReferralSignup(
  referrerCode: string,
  referredUserId: string
): Promise<Referral | null> {
  // Find referrer
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', referrerCode)
    .single();
  
  if (!referrer) return null;
  
  // Create referral record
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: referredUserId,
      referral_code: referrerCode,
      status: 'registered',
      registered_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error tracking referral:', error);
    return null;
  }
  
  // Update referrer stats
  await supabase.rpc('increment_referral_count', { user_id: referrer.id });
  
  // Update achievement progress
  await updateAchievementProgress(referrer.id, 'refer_1', 1);
  
  return transformReferral(data);
}

// ============================================================================
// POINTS
// ============================================================================

export async function getUserPoints(userId: string): Promise<UserPoints | null> {
  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching points:', error);
    return null;
  }
  
  if (!data) {
    // Create initial points record
    const { data: newData } = await supabase
      .from('user_points')
      .insert({ user_id: userId })
      .select()
      .single();
    
    return transformUserPoints(newData);
  }
  
  return transformUserPoints(data);
}

export async function addPoints(
  userId: string,
  points: number,
  sourceType: string,
  sourceId?: string,
  description?: string
): Promise<boolean> {
  const userPoints = await getUserPoints(userId);
  if (!userPoints) return false;
  
  const newBalance = userPoints.availablePoints + points;
  
  // Update balance
  const { error: updateError } = await supabase
    .from('user_points')
    .update({
      total_points: userPoints.totalPoints + points,
      available_points: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  if (updateError) {
    console.error('Error adding points:', updateError);
    return false;
  }
  
  // Log transaction
  await supabase.from('points_transactions').insert({
    user_id: userId,
    transaction_type: 'earn',
    points,
    balance_after: newBalance,
    source_type: sourceType,
    source_id: sourceId,
    description,
  });
  
  return true;
}

export async function spendPoints(
  userId: string,
  points: number,
  description?: string
): Promise<boolean> {
  const userPoints = await getUserPoints(userId);
  if (!userPoints || userPoints.availablePoints < points) return false;
  
  const newBalance = userPoints.availablePoints - points;
  
  const { error } = await supabase
    .from('user_points')
    .update({
      available_points: newBalance,
      spent_points: userPoints.spentPoints + points,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  if (error) return false;
  
  await supabase.from('points_transactions').insert({
    user_id: userId,
    transaction_type: 'spend',
    points: -points,
    balance_after: newBalance,
    description,
  });
  
  return true;
}

export async function getPointsTransactions(userId: string, limit: number = 20): Promise<PointsTransaction[]> {
  const { data, error } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return data?.map(transformPointsTransaction) || [];
}

// ============================================================================
// AGGREGATED DATA
// ============================================================================

export async function getProfileRewardsSummary(userId: string): Promise<ProfileRewardsSummary> {
  const [points, coupons, achievements, referrerStatus] = await Promise.all([
    getUserPoints(userId),
    getCouponCards(userId),
    getAchievementCards(userId),
    getReferrerStatus(userId),
  ]);
  
  const activeCoupons = coupons.filter(c => c.status === 'active');
  const expiringSoon = activeCoupons.filter(c => c.isExpiringSoon);
  const completedAchievements = achievements.filter(a => a.isCompleted);
  const recentlyUnlocked = achievements
    .filter(a => a.isCompleted && a.isNew)
    .slice(0, 3);
  
  return {
    points: {
      available: points?.availablePoints || 0,
      tier: points?.tier || 'bronze',
      tierProgress: points?.tierProgress || 0,
    },
    coupons: {
      active: activeCoupons.length,
      expiringSoon: expiringSoon.length,
      totalSavings: activeCoupons.reduce((sum, c) => sum + c.discountValue, 0),
    },
    achievements: {
      completed: completedAchievements.length,
      total: achievements.length,
      recentlyUnlocked,
    },
    referrals: {
      isReferrer: referrerStatus?.isActiveReferrer || false,
      code: referrerStatus?.referralCode,
      totalReferrals: referrerStatus?.totalReferrals || 0,
      earnings: referrerStatus?.totalEarnings || 0,
      pendingEarnings: referrerStatus?.pendingEarnings || 0,
    },
  };
}

export async function getRewardsDashboard(userId: string): Promise<RewardsDashboard> {
  const [points, coupons, achievements, referrerStatus, referrals, earnings, transactions] = await Promise.all([
    getUserPoints(userId),
    getCouponCards(userId),
    getAchievementCards(userId),
    getReferrerStatus(userId),
    getUserReferrals(userId),
    getReferralEarnings(userId),
    getPointsTransactions(userId, 10),
  ]);
  
  return {
    points: points || {
      id: '',
      userId,
      totalPoints: 0,
      availablePoints: 0,
      spentPoints: 0,
      expiredPoints: 0,
      tier: 'bronze',
      tierPoints: 0,
      nextTierPoints: 1000,
      tierProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    coupons,
    achievements,
    referrerStatus: referrerStatus || undefined,
    referrals,
    recentEarnings: earnings.slice(0, 10),
    recentTransactions: transactions,
  };
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToRewards(
  userId: string,
  onUpdate: (type: string, data: any) => void
): () => void {
  const channels: ReturnType<typeof supabase.channel>[] = [];
  
  // Subscribe to achievements
  const achievementsChannel = supabase
    .channel(`achievements:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_achievements',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      onUpdate('achievement', payload);
    })
    .subscribe();
  channels.push(achievementsChannel);
  
  // Subscribe to coupons
  const couponsChannel = supabase
    .channel(`coupons:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_coupons',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      onUpdate('coupon', payload);
    })
    .subscribe();
  channels.push(couponsChannel);
  
  // Subscribe to referrals
  const referralsChannel = supabase
    .channel(`referrals:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'referrals',
      filter: `referrer_id=eq.${userId}`,
    }, (payload) => {
      onUpdate('referral', payload);
    })
    .subscribe();
  channels.push(referralsChannel);
  
  // Subscribe to points
  const pointsChannel = supabase
    .channel(`points:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_points',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      onUpdate('points', payload);
    })
    .subscribe();
  channels.push(pointsChannel);
  
  // Return cleanup function
  return () => {
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateCouponCode(prefix?: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix ? `${prefix}-` : '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function isNewAchievement(completedAt?: string): boolean {
  if (!completedAt) return false;
  const completed = new Date(completedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7;
}

// Transform functions (snake_case to camelCase)
function transformAchievementDefinition(data: any): AchievementDefinition {
  return {
    id: data.id,
    code: data.code,
    title: data.title,
    description: data.description,
    category: data.category,
    icon: data.icon,
    badgeImageUrl: data.badge_image_url,
    requirementType: data.requirement_type,
    requirementTarget: data.requirement_target,
    requirementField: data.requirement_field,
    rewardType: data.reward_type,
    rewardValue: data.reward_value,
    rewardCouponTemplateId: data.reward_coupon_template_id,
    displayOrder: data.display_order,
    isHidden: data.is_hidden,
    isActive: data.is_active,
    rarity: data.rarity,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformUserAchievement(data: any): UserAchievement {
  return {
    id: data.id,
    userId: data.user_id,
    achievementId: data.achievement_id,
    currentProgress: data.current_progress,
    isCompleted: data.is_completed,
    completedAt: data.completed_at,
    verificationHash: data.verification_hash,
    verifiedAt: data.verified_at,
    verifiedBy: data.verified_by,
    rewardClaimed: data.reward_claimed,
    rewardClaimedAt: data.reward_claimed_at,
    rewardCouponId: data.reward_coupon_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    achievement: data.achievement ? transformAchievementDefinition(data.achievement) : undefined,
  };
}

function transformUserCoupon(data: any): UserCoupon {
  return {
    id: data.id,
    userId: data.user_id,
    templateId: data.template_id,
    code: data.code,
    status: data.status,
    usageCount: data.usage_count,
    maxUsage: data.max_usage,
    issuedAt: data.issued_at,
    expiresAt: data.expires_at,
    usedAt: data.used_at,
    usedOrderId: data.used_order_id,
    discountApplied: data.discount_applied,
    sourceType: data.source_type,
    sourceId: data.source_id,
    verificationHash: data.verification_hash,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    template: data.template ? {
      id: data.template.id,
      codePrefix: data.template.code_prefix,
      title: data.template.title,
      description: data.template.description,
      discountType: data.template.discount_type,
      discountValue: data.template.discount_value,
      minimumPurchase: data.template.minimum_purchase,
      maximumDiscount: data.template.maximum_discount,
      appliesTo: data.template.applies_to,
      applicableIds: data.template.applicable_ids,
      validDays: data.template.valid_days,
      maxUsagePerUser: data.template.max_usage_per_user,
      maxTotalUsage: data.template.max_total_usage,
      sourceType: data.template.source_type,
      isActive: data.template.is_active,
      createdAt: data.template.created_at,
      updatedAt: data.template.updated_at,
    } : undefined,
  };
}

function transformReferral(data: any): Referral {
  return {
    id: data.id,
    referrerId: data.referrer_id,
    referredId: data.referred_id,
    referralCode: data.referral_code,
    status: data.status,
    qualificationType: data.qualification_type,
    qualificationMet: data.qualification_met,
    qualificationMetAt: data.qualification_met_at,
    qualificationData: data.qualification_data,
    referrerRewardType: data.referrer_reward_type,
    referrerRewardValue: data.referrer_reward_value,
    referrerRewardClaimed: data.referrer_reward_claimed,
    referrerRewardClaimedAt: data.referrer_reward_claimed_at,
    referrerCouponId: data.referrer_coupon_id,
    referredRewardType: data.referred_reward_type,
    referredRewardValue: data.referred_reward_value,
    referredRewardClaimed: data.referred_reward_claimed,
    referredRewardClaimedAt: data.referred_reward_claimed_at,
    referredCouponId: data.referred_coupon_id,
    verificationHash: data.verification_hash,
    previousReferralHash: data.previous_referral_hash,
    createdAt: data.created_at,
    registeredAt: data.registered_at,
    updatedAt: data.updated_at,
    referredUser: data.referred_user ? {
      id: data.referred_user.id,
      fullName: data.referred_user.full_name,
      avatarUrl: data.referred_user.avatar_url,
      createdAt: data.referred_user.created_at,
    } : undefined,
  };
}

function transformUserReferrerStatus(data: any): UserReferrerStatus {
  return {
    id: data.id,
    userId: data.user_id,
    isActiveReferrer: data.is_active_referrer,
    referralCode: data.referral_code,
    tierId: data.tier_id,
    tier: data.tier ? {
      id: data.tier.id,
      name: data.tier.name,
      minReferrals: data.tier.min_referrals,
      maxReferrals: data.tier.max_referrals,
      registrationBonus: data.tier.registration_bonus,
      purchaseCommissionRate: data.tier.purchase_commission_rate,
      subscriptionCommissionRate: data.tier.subscription_commission_rate,
      perks: data.tier.perks || [],
      badgeIcon: data.tier.badge_icon,
      createdAt: data.tier.created_at,
    } : undefined,
    totalReferrals: data.total_referrals,
    qualifiedReferrals: data.qualified_referrals,
    totalEarnings: data.total_earnings,
    pendingEarnings: data.pending_earnings,
    paidEarnings: data.paid_earnings,
    payoutMethod: data.payout_method,
    payoutDetails: data.payout_details,
    minimumPayout: data.minimum_payout,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformReferralEarning(data: any): ReferralEarning {
  return {
    id: data.id,
    referrerId: data.referrer_id,
    referralId: data.referral_id,
    earningType: data.earning_type,
    amount: data.amount,
    currency: data.currency,
    sourceOrderId: data.source_order_id,
    sourceSubscriptionId: data.source_subscription_id,
    commissionRate: data.commission_rate,
    status: data.status,
    payoutId: data.payout_id,
    paidAt: data.paid_at,
    verificationHash: data.verification_hash,
    createdAt: data.created_at,
  };
}

function transformUserPoints(data: any): UserPoints {
  const tierThresholds = {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 15000,
    diamond: 50000,
  };
  
  const tier = data.tier || 'bronze';
  const currentTierPoints = tierThresholds[tier as keyof typeof tierThresholds] || 0;
  const nextTierPoints = tier === 'diamond' ? 100000 : 
    tierThresholds[Object.keys(tierThresholds)[Object.keys(tierThresholds).indexOf(tier) + 1] as keyof typeof tierThresholds] || 1000;
  
  const tierProgress = Math.min(100, ((data.total_points - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100);
  
  return {
    id: data.id,
    userId: data.user_id,
    totalPoints: data.total_points,
    availablePoints: data.available_points,
    spentPoints: data.spent_points,
    expiredPoints: data.expired_points,
    tier,
    tierPoints: data.tier_points,
    nextTierPoints,
    tierProgress,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformPointsTransaction(data: any): PointsTransaction {
  return {
    id: data.id,
    userId: data.user_id,
    transactionType: data.transaction_type,
    points: data.points,
    balanceAfter: data.balance_after,
    sourceType: data.source_type,
    sourceId: data.source_id,
    description: data.description,
    expiresAt: data.expires_at,
    expired: data.expired,
    verificationHash: data.verification_hash,
    createdAt: data.created_at,
  };
}
