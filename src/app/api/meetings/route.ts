import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/meetings
 * List user's scheduled meetings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get meetings created by user OR meetings they're invited to
    const { data, error } = await supabase
      .from('scheduled_meetings')
      .select(
        `*,
        participants:meeting_participants(
          user_id,
          email,
          rsvp_status,
          response_at
        ),
        recordings:meeting_recordings(
          id,
          status,
          started_at,
          ended_at,
          duration_seconds,
          file_url
        )`
      )
      .or(`user_id.eq.${user.id},participants.user_id.eq.${user.id}`)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/meetings
 * Create scheduled meeting
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      start_time,
      end_time,
      participant_emails,
      recurrence,
      agenda,
      location,
      video_enabled,
      recording_enabled,
    } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'title, start_time, and end_time are required' },
        { status: 400 }
      );
    }

    // Validate times
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'start_time must be before end_time' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 50);

    // Calculate duration
    const durationSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

    // Create meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('scheduled_meetings')
      .insert([
        {
          user_id: user.id,
          title,
          slug,
          description,
          start_time,
          end_time,
          duration_seconds: durationSeconds,
          recurrence,
          agenda,
          location,
          video_enabled: video_enabled ?? true,
          recording_enabled: recording_enabled ?? false,
          status: 'scheduled',
        },
      ])
      .select()
      .single();

    if (meetingError) {
      console.error('Meeting creation error:', meetingError);
      return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
    }

    // Add creator as required participant
    await supabase
      .from('meeting_participants')
      .insert([
        {
          meeting_id: meeting.id,
          user_id: user.id,
          email: user.email,
          rsvp_status: 'accepted',
          is_organizer: true,
        },
      ]);

    // Add other participants if provided
    if (participant_emails && Array.isArray(participant_emails)) {
      const participants = participant_emails.map((email: string) => ({
        meeting_id: meeting.id,
        email,
        rsvp_status: 'pending',
      }));

      await supabase.from('meeting_participants').insert(participants);
    }

    // Fetch complete meeting with participants
    const { data: fullMeeting } = await supabase
      .from('scheduled_meetings')
      .select(
        `*,
        participants:meeting_participants(
          user_id,
          email,
          rsvp_status,
          is_organizer
        )`
      )
      .eq('id', meeting.id)
      .single();

    return NextResponse.json({ data: fullMeeting }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
