import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/profile-slugs/public/[slug]
 * Get a public profile by slug (no authentication required)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { slug } = await params;

    const { data, error } = await supabase
      .from('profile_slugs')
      .select('id, slug, display_name, bio, profile_image_url, created_at, public')
      .eq('slug', slug)
      .eq('public', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
