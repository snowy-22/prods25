import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/meetings/[id]/participants
 * Add participant to meeting
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, user_id } = body;

    if (!email && !user_id) {
      return NextResponse.json(
        { error: 'Either email or user_id is required' },
        { status: 400 }
      );
    }

    // Verify meeting exists and user is organizer
    const { data: meeting } = await supabase
      .from('scheduled_meetings')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!meeting || meeting.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if participant already exists
    const query = supabase
      .from('meeting_participants')
      .select('id')
      .eq('meeting_id', params.id);

    if (user_id) {
      const { data: existing } = await query.eq('user_id', user_id).single();
      if (existing) {
        return NextResponse.json(
          { error: 'User already invited' },
          { status: 400 }
        );
      }
    } else if (email) {
      const { data: existing } = await query.eq('email', email).single();
      if (existing) {
        return NextResponse.json(
          { error: 'Email already invited' },
          { status: 400 }
        );
      }
    }

    // Add participant
    const { data, error } = await supabase
      .from('meeting_participants')
      .insert([
        {
          meeting_id: params.id,
          user_id: user_id || null,
          email: email || null,
          rsvp_status: 'pending',
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
 * PUT /api/meetings/[id]/participants?participant_id=...
 * Update participant RSVP status
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');

    if (!participantId) {
      return NextResponse.json(
        { error: 'participant_id query parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rsvp_status } = body;

    const validStatuses = ['pending', 'accepted', 'declined', 'tentative'];
    if (!rsvp_status || !validStatuses.includes(rsvp_status)) {
      return NextResponse.json(
        { error: `rsvp_status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get participant
    const { data: participant } = await supabase
      .from('meeting_participants')
      .select('id, user_id, meeting_id')
      .eq('id', participantId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Verify meeting belongs to right meeting and user can update
    // (organizer or self)
    const { data: meeting } = await supabase
      .from('scheduled_meetings')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!meeting || meeting.user_id !== user.id && participant.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update RSVP
    const { data, error } = await supabase
      .from('meeting_participants')
      .update({
        rsvp_status,
        response_at: new Date().toISOString(),
      })
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/meetings/[id]/participants?participant_id=...
 * Remove participant from meeting
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');

    if (!participantId) {
      return NextResponse.json(
        { error: 'participant_id query parameter is required' },
        { status: 400 }
      );
    }

    // Verify organizer
    const { data: meeting } = await supabase
      .from('scheduled_meetings')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!meeting || meeting.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove participant
    const { error } = await supabase
      .from('meeting_participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
