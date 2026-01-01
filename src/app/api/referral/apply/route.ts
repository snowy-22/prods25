/**
 * API Route: Apply Referral Code
 * POST /api/referral/apply
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyReferralCode } from '@/lib/referral';

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
    const { code, autoFriend, autoFollow } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }
    
    const result = await applyReferralCode(code, user.id, {
      autoFriend,
      autoFollow
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        message: 'Referral code applied successfully',
        referral: result.referral 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/referral/apply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
