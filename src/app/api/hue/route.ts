/**
 * Philips Hue API Routes
 * Personal bridge management and light control
 * All data stored in encrypted personal database
 * 
 * POST /api/hue - Discover, link, or control bridge
 * GET /api/hue - Get user's bridges and lights
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Lazy load Supabase and Hue services
    const { createClient } = await import('@supabase/supabase-js');
    const {
      discoverHueBridge,
      linkHueBridge,
      getHueLights,
      setLightState,
      saveBridgeLights,
    } = await import('@/lib/hue-service');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { action, ...payload } = await req.json();

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract token (format: Bearer token)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Handle different actions
    switch (action) {
      case 'discover':
        return NextResponse.json(
          await discoverHueBridge(payload.ipAddress, payload.port)
        );

      case 'link':
        return NextResponse.json(
          await linkHueBridge(
            userId,
            payload.bridgeId,
            payload.ipAddress,
            payload.port
          )
        );

      case 'get-lights':
        const lightsResponse = await getHueLights(
          payload.bridgeId,
          payload.username,
          payload.ipAddress,
          payload.port
        );

        if (lightsResponse.success) {
          // Save lights to database
          await saveBridgeLights(userId, payload.bridgeId, lightsResponse.data);
        }

        return NextResponse.json(lightsResponse);

      case 'set-light-state':
        return NextResponse.json(
          await setLightState(
            payload.lightId,
            payload.state,
            payload.username,
            payload.ipAddress,
            payload.port
          )
        );

      case 'save-lights':
        return NextResponse.json(
          await saveBridgeLights(userId, payload.bridgeId, payload.lights)
        );

      case 'get-bridges':
        return NextResponse.json(
          await getUserBridges(userId)
        );

      case 'get-user-lights':
        return NextResponse.json(
          await getUserLights(userId, payload.bridgeId)
        );

      case 'delete-bridge':
        return NextResponse.json(
          await deleteBridge(userId, payload.bridgeId)
        );

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Hue API error:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${String(error)}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Lazy load Supabase and Hue services
    const { createClient } = await import('@supabase/supabase-js');
    const { getUserBridges, getUserLights } = await import('@/lib/hue-service');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const bridgeId = req.nextUrl.searchParams.get('bridgeId');

    // Get user's bridges and lights
    const bridges = await getUserBridges(userId);
    const lights = await getUserLights(userId, bridgeId || undefined);

    return NextResponse.json({
      success: true,
      data: {
        bridges: bridges.data,
        lights: lights.data,
      },
    });
  } catch (error) {
    console.error('Hue API error:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${String(error)}` },
      { status: 500 }
    );
  }
}
