import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/user/metrics
 * Get analytics metrics for the current user
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch user metrics record
    const { data: userMetrics } = await supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Build date filter
    let dateFilter: any = { user_id: user.id };
    if (startDate) {
      dateFilter.created_at = { gte: startDate };
    }
    if (endDate) {
      dateFilter.created_at = { ...dateFilter.created_at, lte: endDate };
    }

    // Fetch all events for this user in time range
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', user.id);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: events } = await query.order('created_at', { ascending: false });

    // Calculate metrics
    const totalEvents = events?.length || 0;
    
    const eventsByType = (events || []).reduce((acc: any, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    const entityTypeBreakdown = (events || []).reduce((acc: any, event: any) => {
      acc[event.entity_type] = (acc[event.entity_type] || 0) + 1;
      return acc;
    }, {});

    // Get unique sessions
    const uniqueSessions = new Set((events || []).map((e: any) => e.session_id));
    const sessionsCount = uniqueSessions.size;

    // Calculate average session duration (approximate)
    const sessionDurations: Record<string, number> = {};
    (events || []).forEach((event: any) => {
      if (!sessionDurations[event.session_id]) {
        sessionDurations[event.session_id] = 0;
      }
      sessionDurations[event.session_id] += event.duration_ms || 0;
    });

    const totalSessionDuration = Object.values(sessionDurations).reduce((a, b) => a + b, 0);
    const avgSessionDuration = sessionsCount > 0 ? totalSessionDuration / sessionsCount : 0;

    // Get favorite entity types (most interacted with)
    const favoriteEntityTypes = Object.entries(entityTypeBreakdown)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Get top actions
    const topActions = Object.entries(eventsByType)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    // Get last active time
    const lastActiveAt = events?.[0]?.created_at || userMetrics?.last_active_at || null;

    // Get first seen time
    const firstSeenAt = events?.[events.length - 1]?.created_at || userMetrics?.created_at || null;

    const metrics = {
      userId: user.id,
      totalEvents,
      totalViews: eventsByType.view || 0,
      totalClicks: eventsByType.click || 0,
      totalShares: eventsByType.share || 0,
      totalLikes: eventsByType.like || 0,
      sessionsCount,
      avgSessionDuration: Math.round(avgSessionDuration),
      lastActiveAt,
      firstSeenAt,
      eventsByType,
      entityTypeBreakdown,
      favoriteEntityTypes,
      topActions,
      storedMetrics: userMetrics || null,
    };

    return NextResponse.json({
      success: true,
      metrics,
      timeRange: {
        startDate: startDate || 'all time',
        endDate: endDate || 'now',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/user/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
