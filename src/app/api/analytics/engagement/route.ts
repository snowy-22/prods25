import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/engagement
 * Get engagement metrics and score for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all events for this user (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Count content created by user
    const contentCreated = (events || []).filter((e: any) => 
      e.event_type === 'create'
    ).length;

    // Count content consumed (views)
    const contentConsumed = (events || []).filter((e: any) => 
      e.event_type === 'view'
    ).length;

    // Count social interactions
    const socialInteractions = (events || []).filter((e: any) => 
      ['like', 'comment', 'share'].includes(e.event_type)
    ).length;

    // Count collaborations (edits on shared items)
    const collaborations = (events || []).filter((e: any) => 
      e.event_type === 'edit' && e.metadata?.isShared
    ).length;

    // Calculate engagement score (0-100)
    // Formula: weighted sum of activities
    const engagementScore = Math.min(100, Math.round(
      (contentCreated * 10) +
      (contentConsumed * 1) +
      (socialInteractions * 5) +
      (collaborations * 15)
    ) / 10);

    // Determine level based on score
    let level: 'bronze' | 'silver' | 'gold' | 'platinum';
    if (engagementScore >= 75) level = 'platinum';
    else if (engagementScore >= 50) level = 'gold';
    else if (engagementScore >= 25) level = 'silver';
    else level = 'bronze';

    // Calculate monthly active score (activity in last 30 days)
    const totalEvents = events?.length || 0;
    const monthlyActiveScore = Math.min(100, Math.round(totalEvents / 5));

    // Get unique days active
    const uniqueDays = new Set(
      (events || []).map((e: any) => e.created_at.split('T')[0])
    );
    const daysActive = uniqueDays.size;

    // Activity by event type
    const activityByType = (events || []).reduce((acc: any, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    // Top entity types interacted with
    const entityTypeInteractions = (events || []).reduce((acc: any, event: any) => {
      acc[event.entity_type] = (acc[event.entity_type] || 0) + 1;
      return acc;
    }, {});

    const topEntityTypes = Object.entries(entityTypeInteractions)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Recent achievements (milestones)
    const achievements = [];
    
    if (contentCreated >= 10) achievements.push('Creator: 10+ items created');
    if (contentCreated >= 50) achievements.push('Prolific Creator: 50+ items created');
    if (socialInteractions >= 50) achievements.push('Social Butterfly: 50+ interactions');
    if (socialInteractions >= 200) achievements.push('Super Social: 200+ interactions');
    if (daysActive >= 7) achievements.push('Week Warrior: Active 7+ days');
    if (daysActive >= 30) achievements.push('Monthly Champion: Active 30 days');
    if (engagementScore >= 75) achievements.push('Platinum Status: Top 10% engagement');

    const metrics = {
      userId: user.id,
      engagementScore,
      level,
      monthlyActiveScore,
      contentCreated,
      contentConsumed,
      socialInteractions,
      collaborations,
      daysActive,
      totalEvents,
      achievements: achievements.length,
      achievementsList: achievements,
      activityByType,
      topEntityTypes,
      timeRange: {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date().toISOString(),
        days: 30,
      },
    };

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/engagement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
