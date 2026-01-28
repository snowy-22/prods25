/**
 * Share API - Public Share Access
 * 
 * GET /api/share/[token] - Public export access via share token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

interface RouteContext {
  params: Promise<{ token: string }>;
}

// Simple password hash check (matching export-manager)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'canvasflow-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === hash;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    
    // UTM params for analytics
    const utm = {
      source: searchParams.get('utm_source'),
      medium: searchParams.get('utm_medium'),
      campaign: searchParams.get('utm_campaign'),
      term: searchParams.get('utm_term'),
      content: searchParams.get('utm_content'),
    };

    const password = searchParams.get('password');

    const supabase = await createClient();

    // Find export by share token or short code
    const { data: exportData, error: fetchError } = await supabase
      .from('exports')
      .select('*')
      .or(`share_token.eq.${token},short_code.eq.${token}`)
      .single();

    if (fetchError || !exportData) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // Check if public
    if (!exportData.is_public) {
      return NextResponse.json(
        { error: 'This export is private' },
        { status: 403 }
      );
    }

    // Check expiration
    if (exportData.expires_at && new Date(exportData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This export has expired' },
        { status: 410 }
      );
    }

    // Check max views
    if (exportData.max_views && exportData.view_count >= exportData.max_views) {
      return NextResponse.json(
        { error: 'This export has reached maximum views' },
        { status: 410 }
      );
    }

    // Check password
    if (exportData.password_hash) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required', needsPassword: true },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, exportData.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    // Get request headers for analytics
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const referer = headersList.get('referer') || null;
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';

    // Parse user agent for device info
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
    
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let os = 'unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';

    // Increment view count
    await supabase.rpc('increment_export_view', { export_id: exportData.id });

    // Log analytics
    await supabase.from('export_analytics').insert({
      export_id: exportData.id,
      visitor_ip: ip,
      user_agent: userAgent,
      referer_url: referer,
      device_type: deviceType,
      browser,
      os,
      country: null, // Would need IP geolocation service
      city: null,
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      utm_term: utm.term,
      utm_content: utm.content,
      action_type: 'view',
    });

    // Build share URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tv25.app';
    const shareUrl = `${baseUrl}/share/${exportData.share_token}`;
    const shortUrl = `${baseUrl}/s/${exportData.short_code}`;

    // Transform to client-friendly format
    const result = {
      id: exportData.id,
      userId: exportData.user_id,
      sourceId: exportData.source_id,
      sourceType: exportData.source_type,
      type: exportData.type,
      format: exportData.format,
      title: exportData.title,
      description: exportData.description,
      htmlContent: exportData.html_content,
      jsonContent: exportData.json_content,
      imageUrl: exportData.image_url,
      shareToken: exportData.share_token,
      shortCode: exportData.short_code,
      shareUrl,
      shortUrl,
      isPublic: exportData.is_public,
      expiresAt: exportData.expires_at,
      maxViews: exportData.max_views,
      viewCount: (exportData.view_count || 0) + 1, // Include this view
      downloadCount: exportData.download_count || 0,
      shareCount: exportData.share_count || 0,
      settings: exportData.settings || {},
      createdAt: exportData.created_at,
      updatedAt: exportData.updated_at,
    };

    return NextResponse.json({
      success: true,
      export: result,
    });
  } catch (error) {
    console.error('Share access error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Log download or share action
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const { action } = body; // 'download' | 'share'

    if (!action || !['download', 'share'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find export
    const { data: exportData, error: fetchError } = await supabase
      .from('exports')
      .select('id, is_public')
      .or(`share_token.eq.${token},short_code.eq.${token}`)
      .single();

    if (fetchError || !exportData) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // Increment counter
    if (action === 'download') {
      await supabase.rpc('increment_export_download', { export_id: exportData.id });
    } else if (action === 'share') {
      await supabase.rpc('increment_export_share', { export_id: exportData.id });
    }

    // Get headers for analytics
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';

    // Log action
    await supabase.from('export_analytics').insert({
      export_id: exportData.id,
      visitor_ip: ip,
      user_agent: userAgent,
      action_type: action,
    });

    return NextResponse.json({
      success: true,
      message: `${action} logged`,
    });
  } catch (error) {
    console.error('Share action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
