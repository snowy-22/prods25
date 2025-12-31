import { supabase, TrainingProgress, SupabaseError } from './supabase-client';

/**
 * Create or get training progress record
 */
export async function initializeTrainingProgress(
  userId: string,
  moduleId: string,
  moduleTitleTr: string
): Promise<TrainingProgress | null> {
  try {
    // First, try to get existing record
    const { data: existing } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (existing) return existing;

    // Create new record
    const { data, error } = await supabase
      .from('training_progress')
      .insert([
        {
          user_id: userId,
          module_id: moduleId,
          module_title_tr: moduleTitleTr,
          started_at: new Date().toISOString(),
          current_step_id: null,
          completed_steps: [],
          progress: 0,
          quiz_scores: {},
          achievements_earned: [],
        },
      ])
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_INSERT_ERROR');
    
    console.log('✅ Training progress initialized:', data);
    return data;
  } catch (error) {
    console.error('❌ Error initializing training:', error);
    return null;
  }
}

/**
 * Update current step in training module
 */
export async function updateTrainingStep(
  userId: string,
  moduleId: string,
  stepId: string
): Promise<TrainingProgress | null> {
  try {
    const { data, error } = await supabase
      .from('training_progress')
      .update({ current_step_id: stepId })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    return data;
  } catch (error) {
    console.error('❌ Error updating training step:', error);
    return null;
  }
}

/**
 * Mark training step as completed
 */
export async function completeTrainingStep(
  userId: string,
  moduleId: string,
  stepId: string
): Promise<TrainingProgress | null> {
  try {
    // Get current progress
    const { data: current, error: fetchError } = await supabase
      .from('training_progress')
      .select('completed_steps, progress')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (fetchError) throw new SupabaseError(fetchError.message, 'DB_FETCH_ERROR');

    // Add step to completed list if not already there
    const completedSteps = current.completed_steps || [];
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }

    // Assume 6 steps per module for progress calculation
    const newProgress = Math.round((completedSteps.length / 6) * 100);

    // Update record
    const { data, error } = await supabase
      .from('training_progress')
      .update({
        completed_steps: completedSteps,
        progress: Math.min(newProgress, 100),
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    console.log('✅ Step completed:', stepId);
    return data;
  } catch (error) {
    console.error('❌ Error completing step:', error);
    return null;
  }
}

/**
 * Complete entire training module
 */
export async function completeTrainingModule(
  userId: string,
  moduleId: string
): Promise<TrainingProgress | null> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('training_progress')
      .update({
        completed_at: now,
        progress: 100,
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    console.log('✅ Module completed:', moduleId);
    return data;
  } catch (error) {
    console.error('❌ Error completing module:', error);
    return null;
  }
}

/**
 * Save quiz score for a training step
 */
export async function saveQuizScore(
  userId: string,
  moduleId: string,
  stepId: string,
  score: number
): Promise<TrainingProgress | null> {
  try {
    // Get current quiz scores
    const { data: current, error: fetchError } = await supabase
      .from('training_progress')
      .select('quiz_scores')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (fetchError) throw new SupabaseError(fetchError.message, 'DB_FETCH_ERROR');

    // Update quiz scores
    const quizScores = current.quiz_scores || {};
    quizScores[stepId] = score;

    const { data, error } = await supabase
      .from('training_progress')
      .update({ quiz_scores: quizScores })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    return data;
  } catch (error) {
    console.error('❌ Error saving quiz score:', error);
    return null;
  }
}

/**
 * Award achievement from training completion
 */
export async function awardTrainingAchievement(
  userId: string,
  moduleId: string,
  achievementId: string
): Promise<TrainingProgress | null> {
  try {
    // Get current achievements
    const { data: current, error: fetchError } = await supabase
      .from('training_progress')
      .select('achievements_earned')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (fetchError) throw new SupabaseError(fetchError.message, 'DB_FETCH_ERROR');

    // Add achievement if not already earned
    const earned = current.achievements_earned || [];
    if (!earned.includes(achievementId)) {
      earned.push(achievementId);
    }

    const { data, error } = await supabase
      .from('training_progress')
      .update({ achievements_earned: earned })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    console.log('✅ Achievement awarded from training:', achievementId);
    return data;
  } catch (error) {
    console.error('❌ Error awarding achievement:', error);
    return null;
  }
}

/**
 * Get user's training progress
 */
export async function getUserTrainingProgress(userId: string): Promise<TrainingProgress[]> {
  try {
    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw new SupabaseError(error.message, 'DB_FETCH_ERROR');
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching training progress:', error);
    return [];
  }
}

/**
 * Get specific module progress
 */
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<TrainingProgress | null> {
  try {
    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();

    if (error) {
      console.warn('Module progress not found, returning null');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching module progress:', error);
    return null;
  }
}

/**
 * Get training statistics for user
 */
export async function getTrainingStatistics(userId: string) {
  try {
    const progress = await getUserTrainingProgress(userId);
    
    const stats = {
      totalModules: progress.length,
      completedModules: progress.filter(p => p.completed_at).length,
      averageProgress: Math.round(
        progress.reduce((sum, p) => sum + p.progress, 0) / (progress.length || 1)
      ),
      totalAchievementsEarned: new Set(
        progress.flatMap(p => p.achievements_earned)
      ).size,
      averageQuizScore: 0,
      lastModuleCompleted: progress.find(p => p.completed_at)?.module_title_tr,
      estimatedCompletionDate: null as string | null,
    };

    // Calculate average quiz score
    const allScores = progress.flatMap(p => Object.values(p.quiz_scores || {}));
    if (allScores.length > 0) {
      stats.averageQuizScore = Math.round(
        (allScores as number[]).reduce((a, b) => a + b, 0) / allScores.length
      );
    }

    return stats;
  } catch (error) {
    console.error('❌ Error getting training statistics:', error);
    return null;
  }
}

/**
 * Reset training progress for a module
 */
export async function resetTrainingProgress(
  userId: string,
  moduleId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('training_progress')
      .update({
        completed_at: null,
        progress: 0,
        completed_steps: [],
        quiz_scores: {},
        current_step_id: null,
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    console.log('✅ Training progress reset:', moduleId);
    return true;
  } catch (error) {
    console.error('❌ Error resetting training progress:', error);
    return false;
  }
}

/**
 * Bulk get training progress for multiple modules
 */
export async function getUserAllTrainingProgress(userId: string) {
  try {
    const progress = await getUserTrainingProgress(userId);
    
    return {
      summary: await getTrainingStatistics(userId),
      modules: progress,
    };
  } catch (error) {
    console.error('❌ Error fetching all training data:', error);
    return { summary: null, modules: [] };
  }
}
