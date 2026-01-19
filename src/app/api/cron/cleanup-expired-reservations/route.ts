import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Cron Job: Cleanup Expired Reservations
 * Schedule: Every 6 hours (Vercel Cron)
 * Purpose: Mark expired reservations as 'expired' status
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel Cron sends this)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Update expired reservations
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      console.error('❌ Error updating expired reservations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Updated ${data?.length || 0} expired reservations`);

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
