import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/social-groups/[id]/invites
 * Send invite to user
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
    const { user_id, email } = body;

    if (!user_id && !email) {
      return NextResponse.json(
        { error: 'Either user_id or email is required' },
        { status: 400 }
      );
    }

    // Verify user is admin of group
    const { data: admin } = await supabase
      .from('social_group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already invited/member
    if (user_id) {
      const { data: existing } = await supabase
        .from('social_group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', user_id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'User is already a member' },
          { status: 400 }
        );
      }
    }

    // Create invite
    const { data, error } = await supabase
      .from('social_group_invites')
      .insert([
        {
          group_id: id,
          user_id: user_id || null,
          email: email || null,
          invited_by: user.id,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Invite creation error:', error);
      return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/social-groups/[id]/invites
 * List invites (admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('social_group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get invites
    const { data, error } = await supabase
      .from('social_group_invites')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/social-groups/[id]/invites?invite_id=...
 * Cancel invite
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
    const inviteId = searchParams.get('invite_id');

    if (!inviteId) {
      return NextResponse.json(
        { error: 'invite_id query parameter is required' },
        { status: 400 }
      );
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('social_group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete invite
    const { error } = await supabase
      .from('social_group_invites')
      .delete()
      .eq('id', inviteId)
      .eq('group_id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
