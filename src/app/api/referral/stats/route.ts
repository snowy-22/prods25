/**
 * API Route: Get Referral Stats
 * GET /api/referral/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReferralStats } from '@/lib/referral';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const stats = await getReferralStats(user.id);
    
    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/referral/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
