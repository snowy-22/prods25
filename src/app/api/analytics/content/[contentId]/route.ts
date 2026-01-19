import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/content/[contentId]
 * Get analytics metrics for specific content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
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

    // Fetch content metrics record
    const { data: contentMetrics } = await supabase
      .from('content_metrics')
      .select('*')
      .eq('content_id', contentId)
      .maybeSingle();

    // Fetch all events for this content
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('entity_id', contentId);

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

    // Get unique users
    const uniqueUsers = new Set((events || []).map((e: any) => e.user_id));
    const uniqueViewers = uniqueUsers.size;

    // Calculate engagement metrics
    const totalViews = eventsByType.view || 0;
    const totalLikes = eventsByType.like || 0;
    const totalComments = eventsByType.comment || 0;
    const totalShares = eventsByType.share || 0;

    // Engagement rate: (likes + comments + shares) / views
    const engagementRate = totalViews > 0
      ? ((totalLikes + totalComments + totalShares) / totalViews) * 100
      : 0;

    // Calculate average time spent
    const timeEvents = (events || []).filter((e: any) => e.duration_ms > 0);
    const totalTimeSpent = timeEvents.reduce((sum: number, e: any) => sum + e.duration_ms, 0);
    const avgTimeSpent = timeEvents.length > 0 ? totalTimeSpent / timeEvents.length : 0;

    // Get referrers
    const referrerCounts = (events || [])
      .filter((e: any) => e.referer)
      .reduce((acc: any, event: any) => {
        const referer = event.referer;
        acc[referer] = (acc[referer] || 0) + 1;
        return acc;
      }, {});

    const topReferrers = Object.entries(referrerCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([referer, count]) => ({ referer, count }));

    // Device breakdown
    const deviceBreakdown = (events || []).reduce((acc: any, event: any) => {
      const isMobile = event.device_info?.isMobile;
      const deviceType = isMobile ? 'mobile' : 'desktop';
      acc[deviceType] = (acc[deviceType] || 0) + 1;
      return acc;
    }, {});

    // Browser breakdown
    const browserBreakdown = (events || []).reduce((acc: any, event: any) => {
      const browser = event.device_info?.browser || 'unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    // Trending score (simple: views in last 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentViews = (events || []).filter((e: any) => 
      e.event_type === 'view' && new Date(e.created_at) > last24h
    ).length;
    const trending = recentViews > 10;

    const metrics = {
      contentId,
      entityType: events?.[0]?.entity_type || contentMetrics?.content_type || 'unknown',
      entityName: events?.[0]?.entity_name || '',
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      uniqueViewers,
      avgTimeSpent: Math.round(avgTimeSpent),
      engagementRate: Math.round(engagementRate * 100) / 100,
      trending,
      trendingScore: recentViews,
      eventsByType,
      deviceBreakdown,
      browserBreakdown,
      topReferrers,
      storedMetrics: contentMetrics || null,
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
    console.error('Error in GET /api/analytics/content/[contentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
