/**
 * API Route: Generate Referral Code
 * POST /api/referral/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createReferralCode } from '@/lib/referral';

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
    const { maxUses, expiresAt, metadata } = body;
    
    const referralCode = await createReferralCode(user.id, {
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata
    });
    
    if (!referralCode) {
      return NextResponse.json(
        { error: 'Failed to create referral code' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ referralCode }, { status: 201 });
  } catch (error) {
    console.error('Error in /api/referral/generate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
