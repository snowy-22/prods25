import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/calls/[id]/participants
 * Add participant to call
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Verify call exists and user is initiator
    const { data: call } = await supabase
      .from('call_sessions')
      .select('id, initiator_id')
      .eq('id', params.id)
      .single();

    if (!call || call.initiator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if participant already exists
    const { data: existing } = await supabase
      .from('call_participants')
      .select('id')
      .eq('call_id', params.id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a participant' },
        { status: 400 }
      );
    }

    // Add participant
    const { data, error } = await supabase
      .from('call_participants')
      .insert([
        {
          call_id: params.id,
          user_id,
          audio_enabled: false,
          video_enabled: false,
          screen_share_enabled: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Add participant error:', error);
      return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/calls/[id]/participants?user_id=...
 * Remove participant from call
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const participantUserId = searchParams.get('user_id');

    if (!participantUserId) {
      return NextResponse.json({ error: 'user_id query parameter is required' }, { status: 400 });
    }

    // Verify call exists and user is initiator or removing self
    const { data: call } = await supabase
      .from('call_sessions')
      .select('id, initiator_id')
      .eq('id', params.id)
      .single();

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Allow initiator or self-removal
    if (call.initiator_id !== user.id && participantUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove participant
    const { error } = await supabase
      .from('call_participants')
      .delete()
      .eq('call_id', params.id)
      .eq('user_id', participantUserId);

    if (error) {
      console.error('Remove participant error:', error);
      return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
