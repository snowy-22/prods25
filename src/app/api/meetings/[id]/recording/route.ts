import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/meetings/[id]/recording
 * Start or create recording for meeting
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'start' or 'stop'

    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "start" or "stop"' },
        { status: 400 }
      );
    }

    // Verify meeting exists and user is organizer
    const { data: meeting } = await supabase
      .from('scheduled_meetings')
      .select('user_id, recording_enabled')
      .eq('id', id)
      .single();

    if (!meeting || meeting.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!meeting.recording_enabled) {
      return NextResponse.json(
        { error: 'Recording is not enabled for this meeting' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      // Check for active recording
      const { data: activeRecording } = await supabase
        .from('meeting_recordings')
        .select('id')
        .eq('meeting_id', id)
        .eq('status', 'recording')
        .single();

      if (activeRecording) {
        return NextResponse.json(
          { error: 'Recording already in progress' },
          { status: 400 }
        );
      }

      // Create recording
      const { data, error } = await supabase
        .from('meeting_recordings')
        .insert([
          {
            meeting_id: id,
            status: 'recording',
            started_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Start recording error:', error);
        return NextResponse.json(
          { error: 'Failed to start recording' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data }, { status: 201 });
    } else {
      // Stop recording
      // Find active recording
      const { data: recording } = await supabase
        .from('meeting_recordings')
        .select('id, started_at')
        .eq('meeting_id', id)
        .eq('status', 'recording')
        .single();

      if (!recording) {
        return NextResponse.json(
          { error: 'No active recording found' },
          { status: 404 }
        );
      }

      // Calculate duration
      const endTime = new Date();
      const startTime = new Date(recording.started_at);
      const durationSeconds = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      // Update recording
      const { data, error } = await supabase
        .from('meeting_recordings')
        .update({
          status: 'completed',
          ended_at: endTime.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', recording.id)
        .select()
        .single();

      if (error) {
        console.error('Stop recording error:', error);
        return NextResponse.json(
          { error: 'Failed to stop recording' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/meetings/[id]/recording
 * List recordings for meeting
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify meeting exists and user has access
    const { data: meeting } = await supabase
      .from('scheduled_meetings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!meeting || meeting.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get recordings
    const { data, error } = await supabase
      .from('meeting_recordings')
      .select('*')
      .eq('meeting_id', id)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recordings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/meetings/[id]/recording?recording_id=...
 * Delete recording
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('recording_id');

    if (!recordingId) {
      return NextResponse.json(
        { error: 'recording_id query parameter is required' },
        { status: 400 }
      );
    }

    // Verify meeting exists and user is organizer
    const { data: meeting } = await supabase
      .from('scheduled_meetings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!meeting || meeting.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete recording
    const { error } = await supabase
      .from('meeting_recordings')
      .delete()
      .eq('id', recordingId)
      .eq('meeting_id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete recording' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
