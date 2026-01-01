/**
 * API Route: Claim Referral Reward
 * POST /api/referral/claim
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { claimReferralReward } from '@/lib/referral';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { rewardId } = body;
    
    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      );
    }
    
    // Verify reward belongs to user
    const { data: reward } = await supabase
      .from('referral_rewards')
      .select('user_id')
      .eq('id', rewardId)
      .single();
    
    if (!reward || reward.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Reward not found or unauthorized' },
        { status: 403 }
      );
    }
    
    const success = await claimReferralReward(rewardId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to claim reward' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Reward claimed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/referral/claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
