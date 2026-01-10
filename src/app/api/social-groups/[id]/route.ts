import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * Helper: Check if user is admin of group
 */
async function isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: member } = await supabase
    .from('social_group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  return member?.role === 'admin';
}

/**
 * Helper: Check if group is accessible by user
 */
async function canAccessGroup(groupId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: group } = await supabase
    .from('social_groups')
    .select('is_private, created_by')
    .eq('id', groupId)
    .single();

  if (!group) return false;

  // Public groups are accessible to all
  if (!group.is_private) return true;

  // Private groups: only members
  const { data: member } = await supabase
    .from('social_group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  return !!member;
}

/**
 * GET /api/social-groups/[id]
 * Get group details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check access
    const hasAccess = await canAccessGroup(params.id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('social_groups')
      .select(
        `*,
        members:social_group_members(
          user_id,
          role,
          joined_at
        ),
        posts:social_group_posts(
          id,
          content,
          user_id,
          likes_count,
          comments_count,
          created_at
        )`
      )
      .eq('id', params.id)
      .single();

    if (!data) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/social-groups/[id]
 * Update group (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const admin = await isGroupAdmin(params.id, user.id);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, avatar_url, is_private, category } = body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (avatar_url) updates.avatar_url = avatar_url;
    if (is_private !== undefined) updates.is_private = is_private;
    if (category) updates.category = category;

    const { data, error } = await supabase
      .from('social_groups')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/social-groups/[id]
 * Delete group (creator only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify creator
    const { data: group } = await supabase
      .from('social_groups')
      .select('created_by')
      .eq('id', params.id)
      .single();

    if (!group || group.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete related records
    await Promise.all([
      supabase.from('social_group_members').delete().eq('group_id', params.id),
      supabase.from('social_group_posts').delete().eq('group_id', params.id),
      supabase.from('social_group_invites').delete().eq('group_id', params.id),
      supabase.from('join_requests').delete().eq('group_id', params.id),
    ]);

    // Delete group
    const { error: deleteError } = await supabase
      .from('social_groups')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
