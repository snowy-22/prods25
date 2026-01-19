import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/likes/toggle
 * Toggle like/reaction for an item
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { targetId, targetType, reaction } = body;

    // Validate input
    if (!targetId || !targetType) {
      return NextResponse.json(
        { error: 'targetId and targetType are required' },
        { status: 400 }
      );
    }

    const validReactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '⭐', '🎉', '🚀'];
    if (reaction && !validReactions.includes(reaction)) {
      return NextResponse.json(
        { error: `Invalid reaction. Must be one of: ${validReactions.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if like already exists
    const { data: existingLike, error: fetchError } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking existing like:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check like status' },
        { status: 500 }
      );
    }

    let result;
    let action: 'added' | 'removed' | 'updated';

    if (existingLike) {
      // If same reaction, remove it; otherwise update
      if (!reaction || existingLike.reaction === reaction) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) {
          console.error('Error removing like:', error);
          return NextResponse.json(
            { error: 'Failed to remove like' },
            { status: 500 }
          );
        }

        action = 'removed';
        result = null;
      } else {
        // Update reaction
        const { data, error } = await supabase
          .from('likes')
          .update({ reaction, updated_at: new Date().toISOString() })
          .eq('id', existingLike.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating like:', error);
          return NextResponse.json(
            { error: 'Failed to update reaction' },
            { status: 500 }
          );
        }

        action = 'updated';
        result = data;
      }
    } else {
      // Add new like
      const newLike = {
        user_id: user.id,
        target_id: targetId,
        target_type: targetType,
        reaction: reaction || '👍',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('likes')
        .insert(newLike)
        .select()
        .single();

      if (error) {
        console.error('Error adding like:', error);
        return NextResponse.json(
          { error: 'Failed to add like' },
          { status: 500 }
        );
      }

      action = 'added';
      result = data;
    }

    // Get updated like stats
    const { data: allLikes } = await supabase
      .from('likes')
      .select('*')
      .eq('target_id', targetId)
      .eq('target_type', targetType);

    const stats = {
      totalLikes: allLikes?.length || 0,
      userLiked: action === 'added' || action === 'updated',
      userReaction: result?.reaction || null,
      reactionBreakdown: (allLikes || []).reduce((acc: any, like: any) => {
        acc[like.reaction] = (acc[like.reaction] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      action,
      like: result,
      stats,
      message: action === 'added' ? 'Like added' : action === 'removed' ? 'Like removed' : 'Reaction updated'
    });
  } catch (error) {
    console.error('Error in POST /api/likes/toggle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
