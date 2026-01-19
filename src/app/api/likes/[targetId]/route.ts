import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/likes/[targetId]
 * Get like stats for a specific item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  try {
    const { targetId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get targetType from query params
    const searchParams = request.nextUrl.searchParams;
    const targetType = searchParams.get('targetType');

    if (!targetType) {
      return NextResponse.json(
        { error: 'targetType query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch all likes for this target
    const { data: likes, error } = await supabase
      .from('likes')
      .select('*')
      .eq('target_id', targetId)
      .eq('target_type', targetType);

    if (error) {
      console.error('Error fetching likes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch likes' },
        { status: 500 }
      );
    }

    // Check if current user liked this item
    const userLike = likes?.find((like: any) => like.user_id === user.id);

    // Build reaction breakdown
    const reactionBreakdown = (likes || []).reduce((acc: any, like: any) => {
      acc[like.reaction] = (acc[like.reaction] || 0) + 1;
      return acc;
    }, {});

    // Get top reactions (sorted by count)
    const topReactions = Object.entries(reactionBreakdown)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([reaction, count]) => ({ reaction, count }));

    // Get recent likers (last 10)
    const recentLikers = (likes || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((like: any) => ({
        userId: like.user_id,
        reaction: like.reaction,
        createdAt: like.created_at,
      }));

    const stats = {
      targetId,
      targetType,
      totalLikes: likes?.length || 0,
      userLiked: !!userLike,
      userReaction: userLike?.reaction || null,
      reactionBreakdown,
      topReactions,
      recentLikers,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error in GET /api/likes/[targetId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
