/**
 * Profile Types
 * 
 * Kullanıcı profili, ayarları ve referans sistemi için tipler
 */

// ============================================================
// PROFILE TYPES
// ============================================================

export type Gender = 'male' | 'female' | 'non-binary' | 'prefer_not_to_say' | 'other';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  gender?: Gender;
  birth_date?: string; // YYYY-MM-DD
  phone?: string;
  location?: string;
  website?: string;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  
  // Referral System
  referral_code?: string;
  referred_by?: string;
  referral_count: number;
  
  // Visibility
  is_public: boolean;
  verified: boolean;
  
  // Social
  social_links?: SocialLinks;
  
  // Preferences
  preferences?: UserPreferences;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_seen_at?: string;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
  github?: string;
  discord?: string;
  twitch?: string;
  facebook?: string;
  website?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  two_factor_enabled?: boolean;
  privacy_level?: 'public' | 'friends' | 'private';
  show_online_status?: boolean;
  show_activity?: boolean;
  allow_messages_from?: 'everyone' | 'friends' | 'nobody';
}

// ============================================================
// PROFILE SETTINGS FORM
// ============================================================

export interface ProfileSettingsFormData {
  // Basic Info
  username: string;
  full_name: string;
  email: string;
  bio: string;
  
  // Personal Details
  gender: Gender | '';
  birth_date: string;
  phone: string;
  location: string;
  website: string;
  
  // Visibility
  is_public: boolean;
  
  // Social Links
  social_links: SocialLinks;
}

// ============================================================
// REFERRAL SYSTEM
// ============================================================

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_given: boolean;
  reward_type?: 'premium_days' | 'storage_bonus' | 'discount';
  reward_amount?: number;
  created_at: string;
  completed_at?: string;
  
  // Joined data
  referred_user?: Pick<UserProfile, 'id' | 'username' | 'full_name' | 'avatar_url'>;
}

export interface CustomReferralCode {
  id: string;
  code: string;
  code_type: 'promo' | 'influencer' | 'partner' | 'campaign';
  owner_id?: string;
  usage_limit?: number;
  usage_count: number;
  reward_type?: string;
  reward_amount?: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_rewards_earned: number;
  referral_code: string;
  share_url: string;
}

// ============================================================
// USER SLUGS
// ============================================================

export interface UserSlug {
  id: string;
  user_id: string;
  slug: string;
  slug_type: 'username' | 'custom' | 'organization';
  is_primary: boolean;
  is_active: boolean;
  redirect_url?: string;
  access_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSlug {
  id: string;
  organization_id: string;
  slug: string;
  display_name?: string;
  logo_url?: string;
  is_verified: boolean;
  owner_id?: string;
  access_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PUBLIC PROFILE
// ============================================================

export interface PublicProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links?: SocialLinks;
  verified: boolean;
  referral_count: number;
  profile_slug?: string;
  view_count: number;
  created_at: string;
}

export interface ProfileView {
  id: string;
  profile_id: string;
  viewer_id?: string;
  view_source?: 'direct' | 'search' | 'referral' | 'social';
  referrer_url?: string;
  viewed_at: string;
}

// ============================================================
// REFERRAL LEADERBOARD
// ============================================================

export interface LeaderboardEntry {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  referral_count: number;
  verified: boolean;
  slug?: string;
  rank?: number;
}

// ============================================================
// PROFILE SERVICE TYPES
// ============================================================

export interface UpdateProfileRequest {
  username?: string;
  full_name?: string;
  bio?: string;
  gender?: Gender;
  birth_date?: string;
  phone?: string;
  location?: string;
  website?: string;
  is_public?: boolean;
  social_links?: SocialLinks;
  preferences?: UserPreferences;
}

export interface ValidateReferralCodeResponse {
  valid: boolean;
  code_type?: 'user' | 'custom';
  owner_username?: string;
  reward_type?: string;
  reward_amount?: number;
  message?: string;
}

export interface ProfileServiceError {
  code: 'USERNAME_TAKEN' | 'INVALID_USERNAME' | 'PROFILE_NOT_FOUND' | 'UNAUTHORIZED' | 'SERVER_ERROR';
  message: string;
}
