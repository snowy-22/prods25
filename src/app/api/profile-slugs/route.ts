import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/profile-slugs
 * List all profile slugs for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profile_slugs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile slugs' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/profile-slugs
 * Create a new profile slug
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, bio, profile_image_url, is_primary, public: isPublic } = body;

    // Validate required fields
    if (!display_name) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    // Generate slug from display name
    const slug = display_name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    // Check if slug already exists
    const { data: existingSlug } = await supabase
      .from('profile_slugs')
      .select('id')
      .eq('slug', slug)
      .eq('user_id', user.id)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'This slug already exists. Please choose a different display name.' },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primary slugs
    if (is_primary) {
      await supabase
        .from('profile_slugs')
        .update({ is_primary: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('profile_slugs')
      .insert([
        {
          user_id: user.id,
          slug,
          display_name,
          bio: bio || null,
          profile_image_url: profile_image_url || null,
          is_primary: is_primary || false,
          public: isPublic !== false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create profile slug' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
