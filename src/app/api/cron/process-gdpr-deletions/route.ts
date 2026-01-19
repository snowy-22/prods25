import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Cron Job: Process GDPR Data Deletions
 * Schedule: Daily at 2 AM (Vercel Cron)
 * Purpose: Delete user data after 30-day grace period
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get deletion requests ready to process
    const { data: requests, error: fetchError } = await supabase
      .from('gdpr_data_requests')
      .select('*')
      .eq('request_type', 'deletion')
      .eq('status', 'pending')
      .lte('scheduled_deletion_at', new Date().toISOString());

    if (fetchError) {
      console.error('❌ Error fetching GDPR requests:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const deletedUsers: string[] = [];

    for (const req of requests || []) {
      try {
        // Delete user's content items
        await supabase
          .from('content_items')
          .delete()
          .eq('user_id', req.user_id);

        // Delete user's achievements
        await supabase
          .from('user_achievements')
          .delete()
          .eq('user_id', req.user_id);

        // Delete user's analytics
        await supabase
          .from('analytics_events')
          .delete()
          .eq('user_id', req.user_id);

        // Delete user's reservations & purchases
        await supabase
          .from('reservations')
          .delete()
          .eq('user_id', req.user_id);

        await supabase
          .from('purchases')
          .delete()
          .eq('user_id', req.user_id);

        // Delete user profile
        await supabase
          .from('profiles')
          .delete()
          .eq('id', req.user_id);

        // Delete user account
        await supabase
          .from('users')
          .delete()
          .eq('id', req.user_id);

        // Mark request as completed
        await supabase
          .from('gdpr_data_requests')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', req.id);

        deletedUsers.push(req.user_id);
        console.log(`✅ Deleted user data: ${req.user_id}`);
      } catch (err: any) {
        console.error(`❌ Error deleting user ${req.user_id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      processed: requests?.length || 0,
      deleted: deletedUsers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ GDPR cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
