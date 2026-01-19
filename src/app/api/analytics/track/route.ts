import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/analytics/track
 * Track an analytics event
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const {
      eventType,
      entityType,
      entityId,
      entityName,
      durationMs,
      metadata,
      sessionId,
    } = body;

    // Validate input
    if (!eventType || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'eventType, entityType, and entityId are required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = [
      'view', 'click', 'hover', 'scroll', 'focus', 'blur',
      'play', 'pause', 'seek', 'volume', 'fullscreen',
      'create', 'edit', 'delete', 'share', 'like', 'comment',
      'download', 'upload', 'search', 'filter', 'sort',
      'login', 'logout', 'signup', 'error',
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Extract device info from headers
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || null;
    
    // Simple device parsing
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
    const browser = userAgent.match(/(chrome|firefox|safari|edge|opera)/i)?.[1] || 'unknown';
    const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[1] || 'unknown';

    // Create analytics event
    const newEvent = {
      user_id: user.id,
      session_id: sessionId || `session-${Date.now()}`,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName || '',
      duration_ms: durationMs || 0,
      metadata: metadata || {},
      device_info: {
        browser,
        os,
        isMobile,
        userAgent: userAgent.substring(0, 255), // Truncate for storage
        screenSize: metadata?.screenSize || 'unknown',
      },
      referer,
      created_at: new Date().toISOString(),
    };

    const { data: event, error } = await supabase
      .from('analytics_events')
      .insert(newEvent)
      .select()
      .single();

    if (error) {
      console.error('Error tracking event:', error);
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }

    // Update user metrics asynchronously (fire and forget)
    supabase
      .from('user_metrics')
      .upsert({
        user_id: user.id,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .then(() => {})
      .catch((err) => console.error('Error updating user metrics:', err));

    // Update content metrics if view event
    if (eventType === 'view') {
      supabase
        .rpc('increment_content_view', {
          p_content_id: entityId,
          p_content_type: entityType,
        })
        .then(() => {})
        .catch((err) => console.error('Error updating content metrics:', err));
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        eventType: event.event_type,
        entityId: event.entity_id,
        timestamp: event.created_at,
      },
      message: 'Event tracked successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/analytics/track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/track/batch
 * Track multiple analytics events in batch
 */
export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { events, sessionId } = body;

    // Validate input
    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'events array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (events.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 events per batch' },
        { status: 400 }
      );
    }

    // Extract device info
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
    const browser = userAgent.match(/(chrome|firefox|safari|edge|opera)/i)?.[1] || 'unknown';
    const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[1] || 'unknown';

    // Prepare event records
    const eventRecords = events.map((evt: any) => ({
      user_id: user.id,
      session_id: sessionId || `session-${Date.now()}`,
      event_type: evt.eventType,
      entity_type: evt.entityType,
      entity_id: evt.entityId,
      entity_name: evt.entityName || '',
      duration_ms: evt.durationMs || 0,
      metadata: evt.metadata || {},
      device_info: {
        browser,
        os,
        isMobile,
        userAgent: userAgent.substring(0, 255),
      },
      created_at: evt.timestamp || new Date().toISOString(),
    }));

    // Insert all events
    const { data, error } = await supabase
      .from('analytics_events')
      .insert(eventRecords)
      .select();

    if (error) {
      console.error('Error tracking batch events:', error);
      return NextResponse.json(
        { error: 'Failed to track events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tracked: data?.length || 0,
      message: `${data?.length || 0} events tracked successfully`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in PUT /api/analytics/track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
