import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/calls
 * List user's calls (initiated or participated)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get calls initiated by user OR calls they participated in
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
      .or(`initiator_id.eq.${user.id},participants.user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/calls
 * Create new call
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { call_type, participant_ids, description } = body;

    if (!call_type) {
      return NextResponse.json({ error: 'call_type is required' }, { status: 400 });
    }

    const validCallTypes = ['direct', 'group', 'conference', 'webinar'];
    if (!validCallTypes.includes(call_type)) {
      return NextResponse.json(
        { error: `call_type must be one of: ${validCallTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create call
    const { data: callData, error: callError } = await supabase
      .from('call_sessions')
      .insert([
        {
          initiator_id: user.id,
          call_type,
          status: 'pending',
          description,
          participant_count: 1, // Initiator counts as participant
        },
      ])
      .select()
      .single();

    if (callError) {
      console.error('Call creation error:', callError);
      return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
    }

    // Add initiator as participant
    await supabase
      .from('call_participants')
      .insert([
        {
          call_id: callData.id,
          user_id: user.id,
          audio_enabled: true,
          video_enabled: false,
          screen_share_enabled: false,
          joined_at: new Date().toISOString(),
        },
      ]);

    // Add other participants if provided
    if (participant_ids && Array.isArray(participant_ids) && participant_ids.length > 0) {
      const participants = participant_ids.map((pid: string) => ({
        call_id: callData.id,
        user_id: pid,
        audio_enabled: false,
        video_enabled: false,
        screen_share_enabled: false,
      }));

      await supabase.from('call_participants').insert(participants);
    }

    // Fetch complete call with participants
    const { data: fullCall } = await supabase
      .from('call_sessions')
      .select(
        `*,
        participants:call_participants(
          user_id,
          audio_enabled,
          video_enabled,
          screen_share_enabled
        )`
      )
      .eq('id', callData.id)
      .single();

    return NextResponse.json({ data: fullCall }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
