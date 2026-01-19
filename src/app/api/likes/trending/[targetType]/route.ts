import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/likes/trending/[targetType]
 * Get trending items based on likes within a time window
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ targetType: string }> }
) {
  try {
    const { targetType } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeHours = parseInt(searchParams.get('timeHours') || '24', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Validate parameters
    if (timeHours < 1 || timeHours > 168) { // Max 1 week
      return NextResponse.json(
        { error: 'timeHours must be between 1 and 168' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Calculate cutoff time
    const cutoffDate = new Date(Date.now() - timeHours * 60 * 60 * 1000);

    // Fetch recent likes for this type
    const { data: likes, error } = await supabase
      .from('likes')
      .select('*')
      .eq('target_type', targetType)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trending likes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trending data' },
        { status: 500 }
      );
    }

    // Group by target_id and count likes
    const likeCounts: Record<string, number> = {};
    const likeData: Record<string, any> = {};

    (likes || []).forEach((like: any) => {
      const targetId = like.target_id;
      likeCounts[targetId] = (likeCounts[targetId] || 0) + 1;

      if (!likeData[targetId]) {
        likeData[targetId] = {
          targetId,
          targetType,
          likeCount: 0,
          firstLikedAt: like.created_at,
          recentReactions: [],
        };
      }

      likeData[targetId].likeCount = likeCounts[targetId];
      likeData[targetId].recentReactions.push({
        userId: like.user_id,
        reaction: like.reaction,
        createdAt: like.created_at,
      });
    });

    // Sort by like count (descending) and take top items
    const trendingItems = Object.values(likeData)
      .sort((a: any, b: any) => b.likeCount - a.likeCount)
      .slice(0, limit)
      .map((item: any) => ({
        ...item,
        recentReactions: item.recentReactions.slice(0, 5), // Keep only 5 most recent
        trendingScore: item.likeCount, // Simple score based on count
      }));

    // Calculate overall stats
    const totalLikes = likes?.length || 0;
    const uniqueItems = Object.keys(likeCounts).length;

    return NextResponse.json({
      success: true,
      targetType,
      timeWindow: {
        hours: timeHours,
        startDate: cutoffDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      stats: {
        totalLikes,
        uniqueItems,
        avgLikesPerItem: uniqueItems > 0 ? totalLikes / uniqueItems : 0,
      },
      trending: trendingItems,
      count: trendingItems.length,
    });
  } catch (error) {
    console.error('Error in GET /api/likes/trending/[targetType]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
