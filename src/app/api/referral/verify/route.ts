/**
 * API Route: Verify Referral Code
 * POST /api/referral/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyReferralCode } from '@/lib/referral';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }
    
    const result = await verifyReferralCode(code);
    
    return NextResponse.json(result, { 
      status: result.valid ? 200 : 400 
    });
  } catch (error) {
    console.error('Error in /api/referral/verify:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
