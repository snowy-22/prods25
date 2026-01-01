/**
 * REFERRAL SYSTEM UTILITIES
 * 
 * Double-hash mechanism for referral codes:
 * 1. First hash: Generated on code creation (timestamp + user_id)
 * 2. Second hash: Applied when code is used by referee
 * 
 * Features:
 * - QR code generation
 * - Code validation
 * - Reward distribution
 * - Multi-device sync
 */

import { createClient } from '@/lib/supabase/client';
import crypto from 'crypto';

export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  doubleHash?: string;
  qrData?: string;
  usageCount: number;
  maxUses?: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface UserReferral {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCodeId: string;
  codeUsed: string;
  doubleHash: string;
  autoFriend: boolean;
  autoFollow: boolean;
  isFriend: boolean;
  isFollowing: boolean;
  isFollowedBack: boolean;
  refereeVerified: boolean;
  refereeFirstLogin: boolean;
  rewardsClaimed: boolean;
  createdAt: string;
  verifiedAt?: string;
  metadata?: Record<string, any>;
}

export interface ReferralReward {
  id: string;
  referralId: string;
  userId: string;
  rewardType: 'signup' | 'first_login' | 'email_verified' | 'custom';
  rewardCategory: 'achievement' | 'points' | 'badge' | 'item';
  rewardValue: Record<string, any>;
  isClaimed: boolean;
  claimedAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * Generate a timestamped hash for referral code
 */
export function generateReferralHash(userId: string, timestamp?: number): string {
  const ts = timestamp || Date.now();
  const data = `${userId}-${ts}`;
  
  // First hash: SHA-256 of userId + timestamp
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  // Make it URL-friendly and shorter
  const code = hash.substring(0, 12).toUpperCase();
  
  return code;
}

/**
 * Generate double hash when code is used
 */
export function generateDoubleHash(originalCode: string, refereeId: string): string {
  const data = `${originalCode}-${refereeId}-${Date.now()}`;
  
  // Second hash: SHA-256 of original code + referee ID + timestamp
  const doubleHash = crypto.createHash('sha256').update(data).digest('hex');
  
  return doubleHash.substring(0, 16).toUpperCase();
}

/**
 * Generate QR code data URL
 */
export async function generateQRCode(
  userId: string, 
  code: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): Promise<string> {
  const referralUrl = `${baseUrl}/signup?ref=${code}`;
  
  // Return data structure for QR code generation
  // Actual QR image will be generated client-side using qrcode.react
  return JSON.stringify({
    url: referralUrl,
    code,
    userId,
    timestamp: Date.now()
  });
}

/**
 * Create a new referral code for user
 */
export async function createReferralCode(
  userId: string,
  options?: {
    maxUses?: number;
    expiresAt?: Date;
    metadata?: Record<string, any>;
  }
): Promise<ReferralCode | null> {
  try {
    const supabase = createClient();
    
    // Generate hash
    const code = generateReferralHash(userId);
    
    // Generate QR data
    const qrData = await generateQRCode(userId, code);
    
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        user_id: userId,
        code,
        qr_data: qrData,
        max_uses: options?.maxUses,
        expires_at: options?.expiresAt?.toISOString(),
        metadata: options?.metadata || {}
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      code: data.code,
      doubleHash: data.double_hash,
      qrData: data.qr_data,
      usageCount: data.usage_count,
      maxUses: data.max_uses,
      isActive: data.is_active,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('Error creating referral code:', error);
    return null;
  }
}

/**
 * Verify if a referral code is valid
 */
export async function verifyReferralCode(code: string): Promise<{
  valid: boolean;
  referralCode?: ReferralCode;
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return { valid: false, error: 'Referans kodu bulunamadı.' };
    }
    
    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'Referans kodu süresi dolmuş.' };
    }
    
    // Check usage limit
    if (data.max_uses && data.usage_count >= data.max_uses) {
      return { valid: false, error: 'Referans kodu kullanım limiti dolmuş.' };
    }
    
    return {
      valid: true,
      referralCode: {
        id: data.id,
        userId: data.user_id,
        code: data.code,
        doubleHash: data.double_hash,
        qrData: data.qr_data,
        usageCount: data.usage_count,
        maxUses: data.max_uses,
        isActive: data.is_active,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        metadata: data.metadata
      }
    };
  } catch (error) {
    console.error('Error verifying referral code:', error);
    return { valid: false, error: 'Kod doğrulama hatası.' };
  }
}

/**
 * Apply referral code when new user signs up
 */
export async function applyReferralCode(
  code: string,
  refereeId: string,
  options?: {
    autoFriend?: boolean;
    autoFollow?: boolean;
  }
): Promise<{ success: boolean; error?: string; referral?: UserReferral }> {
  try {
    const supabase = createClient();
    
    // Verify code first
    const verification = await verifyReferralCode(code);
    if (!verification.valid || !verification.referralCode) {
      return { success: false, error: verification.error };
    }
    
    const referralCode = verification.referralCode;
    
    // Check if referee already used a referral
    const { data: existingReferral } = await supabase
      .from('user_referrals')
      .select('id')
      .eq('referee_id', refereeId)
      .single();
    
    if (existingReferral) {
      return { success: false, error: 'Bu hesap zaten bir referans kodu kullanmış.' };
    }
    
    // Prevent self-referral
    if (referralCode.userId === refereeId) {
      return { success: false, error: 'Kendi referans kodunuzu kullanamazsınız.' };
    }
    
    // Generate double hash
    const doubleHash = generateDoubleHash(code, refereeId);
    
    // Get referral settings for auto-friend/follow
    const { data: settings } = await supabase
      .from('referral_settings')
      .select('*')
      .eq('user_id', referralCode.userId)
      .single();
    
    const autoFriend = options?.autoFriend ?? settings?.auto_friend_referrals ?? true;
    const autoFollow = options?.autoFollow ?? settings?.auto_follow_referrals ?? true;
    
    // Create referral relationship
    const { data: referral, error: referralError } = await supabase
      .from('user_referrals')
      .insert({
        referrer_id: referralCode.userId,
        referee_id: refereeId,
        referral_code_id: referralCode.id,
        code_used: code,
        double_hash: doubleHash,
        auto_friend: autoFriend,
        auto_follow: autoFollow
      })
      .select()
      .single();
    
    if (referralError) throw referralError;
    
    // Update referral code usage count and double hash
    await supabase
      .from('referral_codes')
      .update({
        usage_count: referralCode.usageCount + 1,
        double_hash: doubleHash
      })
      .eq('id', referralCode.id);
    
    // Create initial rewards (to be claimed after verification)
    await createReferralRewards(referral.id, referralCode.userId, refereeId);
    
    return {
      success: true,
      referral: {
        id: referral.id,
        referrerId: referral.referrer_id,
        refereeId: referral.referee_id,
        referralCodeId: referral.referral_code_id,
        codeUsed: referral.code_used,
        doubleHash: referral.double_hash,
        autoFriend: referral.auto_friend,
        autoFollow: referral.auto_follow,
        isFriend: referral.is_friend,
        isFollowing: referral.is_following,
        isFollowedBack: referral.is_followed_back,
        refereeVerified: referral.referee_verified,
        refereeFirstLogin: referral.referee_first_login,
        rewardsClaimed: referral.rewards_claimed,
        createdAt: referral.created_at,
        verifiedAt: referral.verified_at,
        metadata: referral.metadata
      }
    };
  } catch (error) {
    console.error('Error applying referral code:', error);
    return { success: false, error: 'Referans kodu uygulanırken hata oluştu.' };
  }
}

/**
 * Create rewards for both referrer and referee
 */
async function createReferralRewards(
  referralId: string,
  referrerId: string,
  refereeId: string
): Promise<void> {
  const supabase = createClient();
  
  const rewards = [
    // Referrer rewards
    {
      referral_id: referralId,
      user_id: referrerId,
      reward_type: 'signup',
      reward_category: 'points',
      reward_value: { points: 100, message: 'Bir arkadaşını davet ettin!' }
    },
    {
      referral_id: referralId,
      user_id: referrerId,
      reward_type: 'signup',
      reward_category: 'achievement',
      reward_value: { achievementId: 'referrer_first', message: 'İlk davetiye!' }
    },
    // Referee rewards
    {
      referral_id: referralId,
      user_id: refereeId,
      reward_type: 'signup',
      reward_category: 'points',
      reward_value: { points: 50, message: 'Davetli olarak katıldın!' }
    },
    {
      referral_id: referralId,
      user_id: refereeId,
      reward_type: 'signup',
      reward_category: 'achievement',
      reward_value: { achievementId: 'referee_welcome', message: 'Hoş geldin!' }
    }
  ];
  
  await supabase.from('referral_rewards').insert(rewards);
}

/**
 * Mark referee as verified and unlock additional rewards
 */
export async function verifyReferee(referralId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Update referral status
    const { data: referral, error } = await supabase
      .from('user_referrals')
      .update({
        referee_verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', referralId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Create email verification rewards
    const verificationRewards = [
      {
        referral_id: referralId,
        user_id: referral.referrer_id,
        reward_type: 'email_verified',
        reward_category: 'points',
        reward_value: { points: 50, message: 'Arkadaşın hesabını doğruladı!' }
      },
      {
        referral_id: referralId,
        user_id: referral.referee_id,
        reward_type: 'email_verified',
        reward_category: 'points',
        reward_value: { points: 100, message: 'Hesabını doğruladın!' }
      }
    ];
    
    await supabase.from('referral_rewards').insert(verificationRewards);
    
    return true;
  } catch (error) {
    console.error('Error verifying referee:', error);
    return false;
  }
}

/**
 * Mark referee first login and unlock final rewards
 */
export async function markRefereeFirstLogin(referralId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data: referral, error } = await supabase
      .from('user_referrals')
      .update({ referee_first_login: true })
      .eq('id', referralId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Create first login rewards (double bonus for double-hash!)
    const firstLoginRewards = [
      {
        referral_id: referralId,
        user_id: referral.referrer_id,
        reward_type: 'first_login',
        reward_category: 'points',
        reward_value: { points: 150, message: 'Arkadaşın ilk girişini yaptı! (Çift Bonus)' }
      },
      {
        referral_id: referralId,
        user_id: referral.referee_id,
        reward_type: 'first_login',
        reward_category: 'points',
        reward_value: { points: 200, message: 'İlk giriş bonusu! (Çift Bonus)' }
      },
      {
        referral_id: referralId,
        user_id: referral.referrer_id,
        reward_type: 'first_login',
        reward_category: 'achievement',
        reward_value: { achievementId: 'referrer_complete', message: 'Başarılı Davetiye!' }
      }
    ];
    
    await supabase.from('referral_rewards').insert(firstLoginRewards);
    
    return true;
  } catch (error) {
    console.error('Error marking first login:', error);
    return false;
  }
}

/**
 * Get user's referral statistics
 */
export async function getReferralStats(userId: string): Promise<{
  totalReferrals: number;
  verifiedReferrals: number;
  totalRewards: number;
  unclaimedRewards: number;
  referralCode?: ReferralCode;
}> {
  try {
    const supabase = createClient();
    
    // Get user's referral code
    const { data: code } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    // Get referral stats
    const { data: referrals } = await supabase
      .from('user_referrals')
      .select('referee_verified')
      .eq('referrer_id', userId);
    
    const totalReferrals = referrals?.length || 0;
    const verifiedReferrals = referrals?.filter(r => r.referee_verified).length || 0;
    
    // Get rewards stats
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('is_claimed')
      .eq('user_id', userId);
    
    const totalRewards = rewards?.length || 0;
    const unclaimedRewards = rewards?.filter(r => !r.is_claimed).length || 0;
    
    return {
      totalReferrals,
      verifiedReferrals,
      totalRewards,
      unclaimedRewards,
      referralCode: code ? {
        id: code.id,
        userId: code.user_id,
        code: code.code,
        doubleHash: code.double_hash,
        qrData: code.qr_data,
        usageCount: code.usage_count,
        maxUses: code.max_uses,
        isActive: code.is_active,
        createdAt: code.created_at,
        expiresAt: code.expires_at,
        metadata: code.metadata
      } : undefined
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      verifiedReferrals: 0,
      totalRewards: 0,
      unclaimedRewards: 0
    };
  }
}

/**
 * Claim a referral reward
 */
export async function claimReferralReward(rewardId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('referral_rewards')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString()
      })
      .eq('id', rewardId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error claiming reward:', error);
    return false;
  }
}
