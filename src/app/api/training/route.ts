import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-client';
import {
  initializeTrainingProgress,
  updateTrainingStep,
  completeTrainingStep,
  completeTrainingModule,
  saveQuizScore,
  awardTrainingAchievement,
  getUserTrainingProgress,
  getModuleProgress,
  getTrainingStatistics,
  resetTrainingProgress,
  getUserAllTrainingProgress,
} from '@/lib/db/training';

// ============================================================================
// POST /api/training/initialize
// Initialize training progress for a module
// ============================================================================
export async function initializeTraining(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { module_id, module_title_tr } = body;

    if (!module_id || !module_title_tr) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const progress = await initializeTrainingProgress(
      user.id,
      module_id,
      module_title_tr
    );

    if (!progress) {
      return NextResponse.json(
        { error: 'Failed to initialize training' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, progress },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ POST /api/training/initialize error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/training/:moduleId/step/:stepId
// Complete a training step
// ============================================================================
export async function completeStep(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string; stepId: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId, stepId } = await params;

    const progress = await completeTrainingStep(
      user.id,
      moduleId,
      stepId
    );

    if (!progress) {
      return NextResponse.json(
        { error: 'Failed to complete step' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, progress }, { status: 200 });
  } catch (error) {
    console.error('❌ POST /api/training/:moduleId/step/:stepId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/training/:moduleId/complete
// Complete entire training module
// ============================================================================
export async function completeModule(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;

    const progress = await completeTrainingModule(user.id, moduleId);

    if (!progress) {
      return NextResponse.json(
        { error: 'Failed to complete module' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, progress }, { status: 200 });
  } catch (error) {
    console.error('❌ POST /api/training/:moduleId/complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/training/:moduleId/quiz
// Save quiz score
// ============================================================================
export async function saveQuiz(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;
    const body = await req.json();
    const { step_id, score } = body;

    if (!step_id || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const progress = await saveQuizScore(
      user.id,
      moduleId,
      step_id,
      score
    );

    if (!progress) {
      return NextResponse.json(
        { error: 'Failed to save quiz score' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, progress }, { status: 200 });
  } catch (error) {
    console.error('❌ POST /api/training/:moduleId/quiz error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/training/:moduleId/achievement
// Award achievement from training
// ============================================================================
export async function awardAchievement(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;
    const body = await req.json();
    const { achievement_id } = body;

    if (!achievement_id) {
      return NextResponse.json(
        { error: 'Missing achievement_id' },
        { status: 400 }
      );
    }

    const progress = await awardTrainingAchievement(
      user.id,
      moduleId,
      achievement_id
    );

    if (!progress) {
      return NextResponse.json(
        { error: 'Failed to award achievement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, progress }, { status: 200 });
  } catch (error) {
    console.error('❌ POST /api/training/:moduleId/achievement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/training/progress?userId=...
// Get user's training progress
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const allProgress = await getUserAllTrainingProgress(userId);

    return NextResponse.json({ allProgress }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/training/progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/training/:moduleId/status
// Get specific module progress
// ============================================================================
export async function getModuleStatus(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;

    const progress = await resetTrainingProgress(user.id, moduleId);

    return NextResponse.json({ progress }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/training/:moduleId/status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/training/stats
// Get training statistics
// ============================================================================
export async function getStats(req: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getTrainingStatistics(user.id);

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/training/stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/training/:moduleId
// Reset training progress
// ============================================================================
export async function resetProgress(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;

    const progress = await getUserTrainingProgress(user.id, moduleId);

    if (!progress) {
      return NextResponse.json(
        { error: 'Failed to reset progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ DELETE /api/training/:moduleId error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
