import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-client';
import {
  awardAchievementToDB,
  getUserAchievements,
  getPublicAchievements,
  updateAchievementVisibility,
  verifyAchievementChain,
  addAchievementNote,
  getAchievementBreakdown,
  exportAchievementsAsNFT,
  bulkAwardAchievements,
} from '@/lib/db/achievements';

// ============================================================================
// POST /api/achievements/award
// Award achievement to authenticated user
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      achievement_id,
      title,
      title_tr,
      rarity,
      points,
      category,
      icon,
    } = body;

    // Validate required fields
    if (
      !achievement_id ||
      !title ||
      !title_tr ||
      !rarity ||
      !points ||
      !category
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Award achievement
    const achievement = await awardAchievementToDB(user.id, {
      achievement_id,
      title,
      title_tr,
      rarity,
      points,
      category,
      icon,
    });

    if (!achievement) {
      return NextResponse.json(
        { error: 'Failed to award achievement' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, achievement },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ POST /api/achievements/award error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/achievements?userId=...&public=true
// Fetch user's achievements
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const isPublic = searchParams.get('public') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const achievements = isPublic
      ? await getPublicAchievements(userId)
      : await getUserAchievements(userId);

    return NextResponse.json({ achievements }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/achievements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/achievements/:id
// Update achievement visibility or add note
// ============================================================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { is_publicly_displayed, custom_message } = body;

    // Update visibility
    if (is_publicly_displayed !== undefined) {
      const success = await updateAchievementVisibility(
        params.id,
        is_publicly_displayed
      );
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update visibility' },
          { status: 500 }
        );
      }
    }

    // Add note
    if (custom_message) {
      const success = await addAchievementNote(params.id, custom_message);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to add note' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ PATCH /api/achievements/:id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/achievements/stats/:userId
// Get achievement statistics
// ============================================================================
export async function getAchievementStats(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const userId = pathname.split('/').pop();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const stats = await getAchievementBreakdown(userId);

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/achievements/stats/:userId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/achievements/verify/:achievementId
// Verify blockchain integrity
// ============================================================================
export async function verifyAchievementIntegrity(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const achievementId = pathname.split('/').pop();

    if (!achievementId) {
      return NextResponse.json(
        { error: 'achievementId required' },
        { status: 400 }
      );
    }

    const isValid = await verifyAchievementChain(achievementId);

    return NextResponse.json({ verified: isValid }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/achievements/verify/:achievementId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/achievements/export/:userId
// Export achievements as NFT metadata
// ============================================================================
export async function exportAsNFT(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const userId = pathname.split('/').pop();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const nftMetadata = await exportAchievementsAsNFT(userId);

    if (!nftMetadata) {
      return NextResponse.json(
        { error: 'Failed to export achievements' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        nftMetadata,
        downloadUrl: `data:application/json;base64,${Buffer.from(
          JSON.stringify(nftMetadata, null, 2)
        ).toString('base64')}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ GET /api/achievements/export/:userId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/achievements/bulk
// Bulk award achievements
// ============================================================================
export async function bulkAward(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { achievements } = body;

    if (!Array.isArray(achievements) || achievements.length === 0) {
      return NextResponse.json(
        { error: 'Invalid achievements array' },
        { status: 400 }
      );
    }

    const awarded = await bulkAwardAchievements(user.id, achievements);

    return NextResponse.json(
      { success: true, awarded, count: awarded.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ POST /api/achievements/bulk error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
