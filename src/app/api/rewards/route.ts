/**
 * User Rewards API
 * GET /api/rewards - Kullanıcının ödüllerini ve referans bazlı achievement'larını getir
 * POST /api/rewards/claim - Ödül talep et
 * POST /api/rewards/grant - Manuel ödül ver (test/admin)
 * POST /api/rewards/settings - Ödül görünüm ayarları
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user achievements with definitions
    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievement_definitions(*)
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch achievements:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get summary
    const { data: summary } = await supabase
      .from('user_achievements_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get reward balance
    let storageBonus = 0;
    let premiumDays = 0;
    let unclaimedCount = 0;

    achievements?.forEach((ach) => {
      if (!ach.reward_claimed && ach.reward_amount) {
        unclaimedCount++;
        if (ach.reward_type === 'storage') {
          storageBonus += ach.reward_amount;
        } else if (ach.reward_type === 'premium_days') {
          premiumDays += ach.reward_amount;
        }
      }
    });

    return NextResponse.json({
      achievements: achievements || [],
      summary: summary || null,
      balance: {
        storage_mb: storageBonus,
        premium_days: premiumDays,
        unclaimed_count: unclaimedCount,
      },
    });
  } catch (error) {
    console.error('Rewards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, achievementId, achievementKey, referrerId, organizationId } = body;

    if (action === 'claim') {
      // Claim reward
      const { error } = await supabase
        .from('user_achievements')
        .update({
          reward_claimed: true,
          reward_claimed_at: new Date().toISOString(),
        })
        .eq('id', achievementId)
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // TODO: Apply reward to user account (storage quota, premium subscription, etc.)

      return NextResponse.json({ success: true });
    }

    if (action === 'grant') {
      // Manual grant (for testing/admin)
      const { data, error } = await supabase.rpc('grant_achievement', {
        p_user_id: user.id,
        p_achievement_key: achievementKey,
        p_referrer_id: referrerId || null,
        p_organization_id: organizationId || null,
      });

      if (error) {
        console.error('Grant achievement error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ achievementId: data, success: true });
    }

    if (action === 'settings') {
      // Update display settings
      const { showReferrer, showOrganization } = body;
      const updates: any = {};
      
      if (showReferrer !== undefined) updates.show_referrer = showReferrer;
      if (showOrganization !== undefined) updates.show_organization = showOrganization;

      const { error } = await supabase
        .from('user_achievements')
        .update(updates)
        .eq('id', achievementId)
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Rewards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
