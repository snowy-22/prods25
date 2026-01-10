import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/social-groups
 * List social groups (public + user's private groups)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get public groups + user's private groups
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
          likes_count,
          created_at
        )`
      )
      .or(`is_private.eq.false,created_by.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/social-groups
 * Create social group
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, description, is_private, avatar_url } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'name and category are required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 50);

    // Create group
    const { data: group, error: createError } = await supabase
      .from('social_groups')
      .insert([
        {
          name,
          slug,
          category,
          description,
          created_by: user.id,
          is_private: is_private ?? false,
          avatar_url,
          member_count: 1,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Group creation error:', createError);
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }

    // Add creator as member
    await supabase
      .from('social_group_members')
      .insert([
        {
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        },
      ]);

    // Fetch complete group
    const { data: fullGroup } = await supabase
      .from('social_groups')
      .select(
        `*,
        members:social_group_members(
          user_id,
          role,
          joined_at
        )`
      )
      .eq('id', group.id)
      .single();

    return NextResponse.json({ data: fullGroup }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
