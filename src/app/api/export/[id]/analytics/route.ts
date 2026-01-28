/**
 * Export Analytics API
 * GET /api/export/[id]/analytics - Get analytics for an export
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get export and verify ownership
    const { data: exportData, error: exportError } = await supabase
      .from('exports')
      .select('id, user_id, view_count, download_count, share_count')
      .eq('id', id)
      .single();

    if (exportError || !exportData) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    if (exportData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get analytics data
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('export_analytics')
      .select('*')
      .eq('export_id', id)
      .order('created_at', { ascending: false });

    if (analyticsError) {
      console.error('Analytics fetch error:', analyticsError);
    }

    const analytics = analyticsData || [];

    // Calculate unique visitors (by IP)
    const uniqueIps = new Set(analytics.map(a => a.visitor_ip).filter(Boolean));
    const uniqueVisitors = uniqueIps.size;

    // Top UTM sources
    const sourceMap = new Map<string, number>();
    analytics.forEach(a => {
      if (a.utm_source) {
        sourceMap.set(a.utm_source, (sourceMap.get(a.utm_source) || 0) + 1);
      }
    });
    const topSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top devices
    const deviceMap = new Map<string, number>();
    analytics.forEach(a => {
      if (a.device_type) {
        deviceMap.set(a.device_type, (deviceMap.get(a.device_type) || 0) + 1);
      }
    });
    const topDevices = Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Views over time (last 7 days)
    const now = new Date();
    const days: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = analytics.filter(a => {
        const aDate = new Date(a.created_at).toISOString().split('T')[0];
        return aDate === dateStr && a.action_type === 'view';
      }).length;
      
      days.push({ date: dateStr, count });
    }

    // Top browsers
    const browserMap = new Map<string, number>();
    analytics.forEach(a => {
      if (a.browser) {
        browserMap.set(a.browser, (browserMap.get(a.browser) || 0) + 1);
      }
    });
    const topBrowsers = Array.from(browserMap.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count);

    // Top referrers
    const refererMap = new Map<string, number>();
    analytics.forEach(a => {
      if (a.referer_url) {
        try {
          const url = new URL(a.referer_url);
          const domain = url.hostname;
          refererMap.set(domain, (refererMap.get(domain) || 0) + 1);
        } catch {
          // Invalid URL
        }
      }
    });
    const topReferrers = Array.from(refererMap.entries())
      .map(([referer, count]) => ({ referer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      analytics: {
        totalViews: exportData.view_count || 0,
        totalDownloads: exportData.download_count || 0,
        totalShares: exportData.share_count || 0,
        uniqueVisitors,
        topSources,
        topDevices,
        topBrowsers,
        topReferrers,
        viewsOverTime: days,
        recentEvents: analytics.slice(0, 20).map(a => ({
          action: a.action_type,
          device: a.device_type,
          browser: a.browser,
          os: a.os,
          utmSource: a.utm_source,
          createdAt: a.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
