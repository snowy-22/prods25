import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
        { status: 400 }
      );
    }

    // Get item stats from database
    const { data, error } = await supabase
      .from('item_stats')
      .select('*')
      .eq('item_id', itemId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw error;
    }

    // Return default stats if not found
    if (!data) {
      return NextResponse.json({
        item_id: itemId,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        viewCount: 0,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      item_id: data.item_id,
      likeCount: data.like_count || 0,
      commentCount: data.comment_count || 0,
      shareCount: data.share_count || 0,
      viewCount: data.view_count || 0,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error('Error fetching item stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
