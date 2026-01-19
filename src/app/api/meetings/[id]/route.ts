import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Helper: Verify user created meeting
 */
async function verifyMeetingOwner(meetingId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: meeting } = await supabase
    .from('scheduled_meetings')
    .select('user_id')
    .eq('id', meetingId)
    .single();

  return meeting?.user_id === userId;
}

/**
 * GET /api/meetings/[id]
 * Get meeting details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('scheduled_meetings')
      .select(
        `*,
        participants:meeting_participants(
          user_id,
          email,
          rsvp_status,
          is_organizer,
          response_at
        ),
        recordings:meeting_recordings(
          id,
          status,
          started_at,
          ended_at,
          duration_seconds,
          file_url
        ),
        follow_ups:meeting_follow_ups(
          id,
          action,
          assigned_to,
          due_date,
          status,
          completed_at
        )`
      )
      .eq('id', id)
      .single();

    if (!data) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Verify user access (organizer or participant)
    const isOrganizer = data.user_id === user.id;
    const isParticipant = data.participants?.some(
      (p: any) => p.user_id === user.id
    );

    if (!isOrganizer && !isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/meetings/[id]
 * Update meeting (organizer only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify organizer
    const isOwner = await verifyMeetingOwner(id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      start_time,
      end_time,
      recurrence,
      agenda,
      location,
      video_enabled,
      recording_enabled,
      status,
    } = body;

    const updates: any = { updated_at: new Date().toISOString() };

    // Validate times if provided
    if (start_time || end_time) {
      const startDate = new Date(start_time || Date.now());
      const endDate = new Date(end_time || Date.now());
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'start_time must be before end_time' },
          { status: 400 }
        );
      }

      if (start_time) updates.start_time = start_time;
      if (end_time) {
        updates.end_time = end_time;
        updates.duration_seconds = Math.floor(
          (endDate.getTime() - startDate.getTime()) / 1000
        );
      }
    }

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (recurrence !== undefined) updates.recurrence = recurrence;
    if (agenda !== undefined) updates.agenda = agenda;
    if (location !== undefined) updates.location = location;
    if (video_enabled !== undefined) updates.video_enabled = video_enabled;
    if (recording_enabled !== undefined) updates.recording_enabled = recording_enabled;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from('scheduled_meetings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/meetings/[id]
 * Delete meeting (organizer only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify organizer
    const isOwner = await verifyMeetingOwner(id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete related records
    await Promise.all([
      supabase.from('meeting_participants').delete().eq('meeting_id', id),
      supabase.from('meeting_recordings').delete().eq('meeting_id', id),
      supabase.from('meeting_follow_ups').delete().eq('meeting_id', id),
    ]);

    // Delete meeting
    const { error: deleteError } = await supabase
      .from('scheduled_meetings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
