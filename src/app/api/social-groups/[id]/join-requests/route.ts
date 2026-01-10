import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/social-groups/[id]/join-requests
 * Request to join private group
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check group exists
    const { data: group, error: groupError } = await supabase
      .from('social_groups')
      .select('id, is_private')
      .eq('id', params.id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!group.is_private) {
      return NextResponse.json(
        { error: 'Can only request to join private groups' },
        { status: 400 }
      );
    }

    // Check if already member
    const { data: existing } = await supabase
      .from('social_group_members')
      .select('id')
      .eq('group_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already a member of this group' },
        { status: 400 }
      );
    }

    // Check if pending request exists
    const { data: pendingRequest } = await supabase
      .from('join_requests')
      .select('id')
      .eq('group_id', params.id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (pendingRequest) {
      return NextResponse.json(
        { error: 'Join request already pending' },
        { status: 400 }
      );
    }

    // Create join request
    const { data, error } = await supabase
      .from('join_requests')
      .insert([
        {
          group_id: params.id,
          user_id: user.id,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Join request creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create join request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/social-groups/[id]/join-requests
 * List join requests (admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('social_group_members')
      .select('role')
      .eq('group_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get join requests
    const { data, error } = await supabase
      .from('join_requests')
      .select('*')
      .eq('group_id', params.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch join requests' },
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
 * PUT /api/social-groups/[id]/join-requests?request_id=...
 * Approve or reject join request
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');
    const body = await request.json();
    const { status, action } = body; // status: 'approved' | 'rejected', or action: 'approve' | 'reject'

    if (!requestId) {
      return NextResponse.json(
        { error: 'request_id query parameter is required' },
        { status: 400 }
      );
    }

    if (!status && !action) {
      return NextResponse.json(
        { error: 'status or action field is required' },
        { status: 400 }
      );
    }

    const finalStatus = status || action;
    if (!['approved', 'rejected', 'approve', 'reject'].includes(finalStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Use approved or rejected' },
        { status: 400 }
      );
    }

    // Normalize status
    const normalizedStatus =
      finalStatus === 'approve' ? 'approved' : finalStatus === 'reject' ? 'rejected' : finalStatus;

    // Verify admin
    const { data: admin } = await supabase
      .from('social_group_members')
      .select('role')
      .eq('group_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get join request
    const { data: joinRequest, error: fetchError } = await supabase
      .from('join_requests')
      .select('*')
      .eq('id', requestId)
      .eq('group_id', params.id)
      .single();

    if (fetchError || !joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    if (normalizedStatus === 'approved') {
      // Add user as member
      const { error: memberError } = await supabase.from('social_group_members').insert([
        {
          group_id: params.id,
          user_id: joinRequest.user_id,
          role: 'member',
          joined_at: new Date().toISOString(),
        },
      ]);

      if (memberError) {
        console.error('Member addition error:', memberError);
        return NextResponse.json(
          { error: 'Failed to add member' },
          { status: 500 }
        );
      }
    }

    // Update join request
    const { data, error } = await supabase
      .from('join_requests')
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update join request' },
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
 * DELETE /api/social-groups/[id]/join-requests?request_id=...
 * Cancel join request
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');

    if (!requestId) {
      return NextResponse.json(
        { error: 'request_id query parameter is required' },
        { status: 400 }
      );
    }

    // Get request
    const { data: joinRequest } = await supabase
      .from('join_requests')
      .select('*')
      .eq('id', requestId)
      .eq('group_id', params.id)
      .single();

    // Allow requester to cancel, or admin to reject
    if (joinRequest?.user_id !== user.id) {
      const { data: admin } = await supabase
        .from('social_group_members')
        .select('role')
        .eq('group_id', params.id)
        .eq('user_id', user.id)
        .single();

      if (!admin || admin.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Delete
    const { error } = await supabase
      .from('join_requests')
      .delete()
      .eq('id', requestId)
      .eq('group_id', params.id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to cancel request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
