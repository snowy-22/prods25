import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/message-groups
 * List all message groups for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('message_groups')
      .select('*')
      .or(`created_by.eq.${user.id},id.in(select group_id from group_members where user_id.eq.${user.id})`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch message groups' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/message-groups
 * Create a new message group
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, is_private } = body;

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    const { data, error } = await supabase
      .from('message_groups')
      .insert([
        {
          name,
          slug,
          description: description || null,
          created_by: user.id,
          is_private: is_private || false,
          message_count: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create message group' }, { status: 500 });
    }

    // Add creator as member with owner role
    await supabase
      .from('group_members')
      .insert([
        {
          group_id: data.id,
          user_id: user.id,
          role: 'owner',
        },
      ]);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
