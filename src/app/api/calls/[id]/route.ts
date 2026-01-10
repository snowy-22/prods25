import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * Helper: Verify user participated in call or initiated it
 */
async function verifyCallAccess(callId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: call } = await supabase
    .from('call_sessions')
    .select('id, initiator_id')
    .eq('id', callId)
    .single();

  if (!call) return false;

  // Initiator has full access
  if (call.initiator_id === userId) return true;

  // Check if user participated
  const { data: participant } = await supabase
    .from('call_participants')
    .select('id')
    .eq('call_id', callId)
    .eq('user_id', userId)
    .single();

  return !!participant;
}

/**
 * GET /api/calls/[id]
 * Get call details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access
    const hasAccess = await verifyCallAccess(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('call_sessions')
      .select(
        `*,
        participants:call_participants(
          user_id,
          audio_enabled,
          video_enabled,
          screen_share_enabled,
          joined_at,
          left_at
        )`
      )
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/calls/[id]
 * Update call status (initiator only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify initiator
    const { data: call } = await supabase
      .from('call_sessions')
      .select('initiator_id')
      .eq('id', params.id)
      .single();

    if (!call || call.initiator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, description } = body;

    const validStatuses = ['pending', 'active', 'ended', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (description !== undefined) updates.description = description;
    if (status === 'ended') updates.ended_at = new Date().toISOString();
    if (status === 'active' && !(call as any).started_at) updates.started_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('call_sessions')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update call' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/calls/[id]
 * Delete call (initiator only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify initiator
    const { data: call } = await supabase
      .from('call_sessions')
      .select('initiator_id')
      .eq('id', params.id)
      .single();

    if (!call || call.initiator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete participants first
    await supabase
      .from('call_participants')
      .delete()
      .eq('call_id', params.id);

    // Delete call
    const { error: deleteError } = await supabase
      .from('call_sessions')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete call' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
