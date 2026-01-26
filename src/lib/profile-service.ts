/**
 * Profile Service
 * 
 * Profil yönetimi, referral sistemi ve slug işlemleri için servis
 */

import { createClient } from '@/lib/supabase/client';
import {
  UserProfile,
  UpdateProfileRequest,
  Referral,
  ReferralStats,
  UserSlug,
  PublicProfile,
  LeaderboardEntry,
  ValidateReferralCodeResponse,
  CustomReferralCode,
} from './profile-types';

class ProfileService {
  private supabase = createClient();

  // ============================================================
  // PROFILE CRUD
  // ============================================================

  async getCurrentProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Failed to get profile:', error);
      return null;
    }

    return data as UserProfile;
  }

  async getProfileById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to get profile:', error);
      return null;
    }

    return data as UserProfile;
  }

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error) {
      console.error('Failed to get profile by username:', error);
      return null;
    }

    return data as UserProfile;
  }

  async updateProfile(updates: UpdateProfileRequest): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Username değişiyorsa, unique kontrolü yap
    if (updates.username) {
      const normalizedUsername = updates.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      if (normalizedUsername.length < 3) {
        return { success: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır' };
      }

      const { data: existing } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('username', normalizedUsername)
        .neq('id', user.id)
        .single();

      if (existing) {
        return { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' };
      }

      updates.username = normalizedUsername;
    }

    const { error } = await this.supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    const { data } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .single();

    return !data;
  }

  // ============================================================
  // PUBLIC PROFILES
  // ============================================================

  async getPublicProfile(slug: string): Promise<PublicProfile | null> {
    // Önce user_slugs tablosundan ara
    const { data: slugData } = await this.supabase
      .from('user_slugs')
      .select('user_id')
      .eq('slug', slug.toLowerCase())
      .eq('is_active', true)
      .single();

    if (slugData) {
      const { data } = await this.supabase
        .from('profiles')
        .select(`
          id, username, full_name, avatar_url, bio, location, website,
          social_links, verified, referral_count, created_at, is_public
        `)
        .eq('id', slugData.user_id)
        .eq('is_public', true)
        .single();

      if (data) {
        return {
          ...data,
          profile_slug: slug,
          view_count: 0, // TODO: Get from profile_views
        } as PublicProfile;
      }
    }

    // Username ile dene
    const { data } = await this.supabase
      .from('profiles')
      .select(`
        id, username, full_name, avatar_url, bio, location, website,
        social_links, verified, referral_count, created_at, is_public
      `)
      .eq('username', slug.toLowerCase())
      .eq('is_public', true)
      .single();

    if (data) {
      return {
        ...data,
        profile_slug: data.username,
        view_count: 0,
      } as PublicProfile;
    }

    return null;
  }

  async logProfileView(profileId: string, source?: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();

    await this.supabase.from('profile_views').insert({
      profile_id: profileId,
      viewer_id: user?.id || null,
      view_source: source || 'direct',
      referrer_url: typeof window !== 'undefined' ? document.referrer : null,
    });
  }

  // ============================================================
  // REFERRAL SYSTEM
  // ============================================================

  async getReferralStats(): Promise<ReferralStats | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const profile = await this.getCurrentProfile();
    if (!profile) return null;

    const { data: referrals } = await this.supabase
      .from('referrals')
      .select('status')
      .eq('referrer_id', user.id);

    const completed = referrals?.filter(r => r.status === 'completed').length || 0;
    const pending = referrals?.filter(r => r.status === 'pending').length || 0;

    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'https://tv25.app';

    return {
      total_referrals: referrals?.length || 0,
      completed_referrals: completed,
      pending_referrals: pending,
      total_rewards_earned: completed * 7, // Her tamamlanan referral için 7 gün premium
      referral_code: profile.referral_code || profile.username || '',
      share_url: `${baseUrl}/register?ref=${profile.referral_code || profile.username}`,
    };
  }

  async getMyReferrals(): Promise<Referral[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('referrals')
      .select(`
        *,
        referred_user:profiles!referrals_referred_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get referrals:', error);
      return [];
    }

    return data as Referral[];
  }

  async validateReferralCode(code: string): Promise<ValidateReferralCodeResponse> {
    // Önce kullanıcı referral kodu olarak kontrol et
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('username, referral_code')
      .or(`referral_code.eq.${code.toLowerCase()},username.eq.${code.toLowerCase()}`)
      .single();

    if (profile) {
      return {
        valid: true,
        code_type: 'user',
        owner_username: profile.username,
        reward_type: 'premium_days',
        reward_amount: 7,
        message: `${profile.username} tarafından davet edildiniz! Üye olduğunuzda 7 gün premium kazanacaksınız.`,
      };
    }

    // Custom referral kodu olarak kontrol et
    const { data: customCode } = await this.supabase
      .from('custom_referral_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (customCode) {
      const now = new Date();
      const validFrom = new Date(customCode.valid_from);
      const validUntil = customCode.valid_until ? new Date(customCode.valid_until) : null;

      if (now < validFrom) {
        return { valid: false, message: 'Bu kod henüz aktif değil.' };
      }

      if (validUntil && now > validUntil) {
        return { valid: false, message: 'Bu kodun süresi dolmuş.' };
      }

      if (customCode.usage_limit && customCode.usage_count >= customCode.usage_limit) {
        return { valid: false, message: 'Bu kod kullanım limitine ulaşmış.' };
      }

      return {
        valid: true,
        code_type: 'custom',
        reward_type: customCode.reward_type,
        reward_amount: customCode.reward_amount,
        message: `Geçerli promosyon kodu! ${customCode.reward_amount} ${customCode.reward_type === 'premium_days' ? 'gün premium' : customCode.reward_type} kazanacaksınız.`,
      };
    }

    return { valid: false, message: 'Geçersiz davet kodu.' };
  }

  async getReferralLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, referral_count, verified')
      .gt('referral_count', 0)
      .eq('is_public', true)
      .order('referral_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }

    return (data || []).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })) as LeaderboardEntry[];
  }

  // ============================================================
  // USER SLUGS
  // ============================================================

  async getMySlug(): Promise<UserSlug | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data } = await this.supabase
      .from('user_slugs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();

    return data as UserSlug | null;
  }

  async updateSlug(newSlug: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const normalizedSlug = newSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    if (normalizedSlug.length < 3) {
      return { success: false, error: 'Slug en az 3 karakter olmalıdır' };
    }

    // Slug unique kontrolü
    const { data: existing } = await this.supabase
      .from('user_slugs')
      .select('id')
      .eq('slug', normalizedSlug)
      .neq('user_id', user.id)
      .single();

    if (existing) {
      return { success: false, error: 'Bu slug zaten kullanılıyor' };
    }

    // Mevcut slug'ı güncelle veya yeni oluştur
    const { error } = await this.supabase
      .from('user_slugs')
      .upsert({
        user_id: user.id,
        slug: normalizedSlug,
        slug_type: 'username',
        is_primary: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,is_primary',
      });

    if (error) {
      console.error('Failed to update slug:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  getProfileUrl(usernameOrSlug: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'https://tv25.app';
    
    return `${baseUrl}/${usernameOrSlug.toLowerCase()}`;
  }

  getShareUrl(usernameOrSlug: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'https://tv25.app';
    
    return `${baseUrl}/register?ref=${usernameOrSlug.toLowerCase()}`;
  }
}

export const profileService = new ProfileService();
