import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/social-groups/[id]/posts
 * Create post in group
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
    const { content, media_urls } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // Verify user is member of group
    const { data: member } = await supabase
      .from('social_group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create post
    const { data, error } = await supabase
      .from('social_group_posts')
      .insert([
        {
          group_id: id,
          user_id: user.id,
          content: content.trim(),
          media: media_urls || [],
          likes_count: 0,
          comments_count: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Post creation error:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/social-groups/[id]/posts
 * List posts in group
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user access to group
    const { data: group } = await supabase
      .from('social_groups')
      .select('is_private')
      .eq('id', id)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // For private groups, verify membership
    if (group.is_private) {
      const { data: member } = await supabase
        .from('social_group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .single();

      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get posts
    const { data, error } = await supabase
      .from('social_group_posts')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/social-groups/[id]/posts?post_id=...
 * Update post (author only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json(
        { error: 'post_id query parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // Verify post ownership
    const { data: post } = await supabase
      .from('social_group_posts')
      .select('user_id')
      .eq('id', postId)
      .eq('group_id', id)
      .single();

    if (!post || post.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update post
    const { data, error } = await supabase
      .from('social_group_posts')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/social-groups/[id]/posts?post_id=...
 * Delete post (author or admin)
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
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json(
        { error: 'post_id query parameter is required' },
        { status: 400 }
      );
    }

    // Get post and group
    const { data: post } = await supabase
      .from('social_group_posts')
      .select('user_id')
      .eq('id', postId)
      .eq('group_id', id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is author or admin
    const isAuthor = post.user_id === user.id;
    const { data: admin } = await supabase
      .from('social_group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single();

    if (!isAuthor && admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete post
    const { error } = await supabase
      .from('social_group_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
