/**
 * Achievement Tracker Integration
 * 
 * Integrates the operation system with achievements.
 * Tracks user activities and grants achievements based on milestones.
 */

import { achievementService } from './achievements-service';
import type { OperationType } from './operation-service';

// Achievement rules based on operation counts
interface AchievementRule {
  achievementKey: string;
  operationType: OperationType | OperationType[];
  targetTable?: string | string[];
  requiredCount: number;
  description: string;
}

// Define achievement rules
const ACHIEVEMENT_RULES: AchievementRule[] = [
  // Content Creation Achievements
  {
    achievementKey: 'first_item',
    operationType: 'create',
    targetTable: 'canvas_items',
    requiredCount: 1,
    description: 'İlk içerik oluşturuldu'
  },
  {
    achievementKey: 'content_creator_10',
    operationType: 'create',
    targetTable: 'canvas_items',
    requiredCount: 10,
    description: '10 içerik oluşturuldu'
  },
  {
    achievementKey: 'content_creator_50',
    operationType: 'create',
    targetTable: 'canvas_items',
    requiredCount: 50,
    description: '50 içerik oluşturuldu'
  },
  {
    achievementKey: 'content_creator_100',
    operationType: 'create',
    targetTable: 'canvas_items',
    requiredCount: 100,
    description: '100 içerik oluşturuldu'
  },
  
  // Folder Organization
  {
    achievementKey: 'first_folder',
    operationType: 'create',
    targetTable: 'folders',
    requiredCount: 1,
    description: 'İlk klasör oluşturuldu'
  },
  {
    achievementKey: 'organizer_5',
    operationType: 'create',
    targetTable: 'folders',
    requiredCount: 5,
    description: '5 klasör oluşturuldu'
  },
  
  // Active Editor Achievements
  {
    achievementKey: 'first_edit',
    operationType: 'update',
    requiredCount: 1,
    description: 'İlk düzenleme yapıldı'
  },
  {
    achievementKey: 'active_editor_25',
    operationType: 'update',
    requiredCount: 25,
    description: '25 düzenleme yapıldı'
  },
  {
    achievementKey: 'active_editor_100',
    operationType: 'update',
    requiredCount: 100,
    description: '100 düzenleme yapıldı'
  },
  {
    achievementKey: 'power_editor_500',
    operationType: 'update',
    requiredCount: 500,
    description: '500 düzenleme yapıldı'
  },
  
  // Style Master
  {
    achievementKey: 'style_first',
    operationType: 'style_change',
    requiredCount: 1,
    description: 'İlk stil değişikliği'
  },
  {
    achievementKey: 'style_master_20',
    operationType: 'style_change',
    requiredCount: 20,
    description: '20 stil değişikliği'
  },
  
  // Total Operations
  {
    achievementKey: 'operations_100',
    operationType: ['create', 'update', 'delete', 'move', 'style_change'],
    requiredCount: 100,
    description: 'Toplam 100 işlem'
  },
  {
    achievementKey: 'operations_500',
    operationType: ['create', 'update', 'delete', 'move', 'style_change'],
    requiredCount: 500,
    description: 'Toplam 500 işlem'
  },
  {
    achievementKey: 'operations_1000',
    operationType: ['create', 'update', 'delete', 'move', 'style_change'],
    requiredCount: 1000,
    description: 'Toplam 1000 işlem'
  }
];

// In-memory cache for operation counts
const operationCountCache = new Map<string, Map<string, number>>();

/**
 * Get cache key for user operation type
 */
function getCacheKey(userId: string, operationType: string, targetTable?: string): string {
  return targetTable ? `${userId}:${operationType}:${targetTable}` : `${userId}:${operationType}`;
}

/**
 * Check and grant achievements after an operation
 */
export async function checkAchievementsAfterOperation(
  userId: string,
  operationType: OperationType,
  targetTable: string,
  operationCounts?: {
    byType: Record<string, number>;
    byTable: Record<string, number>;
    total: number;
  }
): Promise<string[]> {
  const grantedAchievements: string[] = [];
  
  try {
    // Check each rule
    for (const rule of ACHIEVEMENT_RULES) {
      // Check if operation type matches
      const matchesType = Array.isArray(rule.operationType)
        ? rule.operationType.includes(operationType)
        : rule.operationType === operationType;
      
      if (!matchesType) continue;
      
      // Check if target table matches (if specified)
      if (rule.targetTable) {
        const matchesTable = Array.isArray(rule.targetTable)
          ? rule.targetTable.includes(targetTable)
          : rule.targetTable === targetTable;
        
        if (!matchesTable) continue;
      }
      
      // Get operation count for this rule
      let count = 0;
      
      if (operationCounts) {
        if (rule.targetTable) {
          // Specific table count
          const tables = Array.isArray(rule.targetTable) ? rule.targetTable : [rule.targetTable];
          for (const table of tables) {
            count += operationCounts.byTable[table] || 0;
          }
        } else if (Array.isArray(rule.operationType)) {
          // Multiple operation types - use total
          count = operationCounts.total;
        } else {
          // Single operation type
          count = operationCounts.byType[rule.operationType] || 0;
        }
      }
      
      // Check if achievement threshold is met
      if (count >= rule.requiredCount) {
        // Try to grant achievement
        const achievementId = await achievementService.grantAchievement(
          userId,
          rule.achievementKey
        );
        
        if (achievementId) {
          grantedAchievements.push(rule.achievementKey);
          console.log(`[Achievement] Granted "${rule.achievementKey}" to user ${userId}`);
        }
      }
    }
    
  } catch (error) {
    console.error('[Achievement] Error checking achievements:', error);
  }
  
  return grantedAchievements;
}

/**
 * Get user's operation statistics for achievement checking
 */
export async function getOperationStats(userId: string): Promise<{
  byType: Record<string, number>;
  byTable: Record<string, number>;
  total: number;
}> {
  const { createClient } = await import('./supabase/client');
  const supabase = createClient();
  
  try {
    // Get counts by operation type
    const { data: typeData } = await supabase
      .from('operation_history')
      .select('operation_type')
      .eq('user_id', userId)
      .eq('is_undone', false);
    
    const byType: Record<string, number> = {};
    const byTable: Record<string, number> = {};
    
    if (typeData) {
      for (const row of typeData) {
        byType[row.operation_type] = (byType[row.operation_type] || 0) + 1;
      }
    }
    
    // Get counts by target table
    const { data: tableData } = await supabase
      .from('operation_history')
      .select('target_table')
      .eq('user_id', userId)
      .eq('is_undone', false);
    
    if (tableData) {
      for (const row of tableData) {
        byTable[row.target_table] = (byTable[row.target_table] || 0) + 1;
      }
    }
    
    const total = Object.values(byType).reduce((sum, count) => sum + count, 0);
    
    return { byType, byTable, total };
    
  } catch (error) {
    console.error('[Achievement] Error getting operation stats:', error);
    return { byType: {}, byTable: {}, total: 0 };
  }
}

/**
 * Manually trigger achievement check for a user
 */
export async function triggerAchievementCheck(userId: string): Promise<string[]> {
  const stats = await getOperationStats(userId);
  
  // Use 'update' as a generic type to check all rules
  return checkAchievementsAfterOperation(userId, 'update', 'any', stats);
}

/**
 * Get achievement progress for a user
 */
export async function getAchievementProgress(userId: string): Promise<{
  achievementKey: string;
  description: string;
  currentCount: number;
  requiredCount: number;
  percentage: number;
  isCompleted: boolean;
}[]> {
  const stats = await getOperationStats(userId);
  const userAchievements = await achievementService.getUserAchievements(userId);
  const completedKeys = new Set(userAchievements.map(a => a.achievement_key));
  
  return ACHIEVEMENT_RULES.map(rule => {
    // Calculate current count
    let count = 0;
    
    if (rule.targetTable) {
      const tables = Array.isArray(rule.targetTable) ? rule.targetTable : [rule.targetTable];
      for (const table of tables) {
        count += stats.byTable[table] || 0;
      }
    } else if (Array.isArray(rule.operationType)) {
      count = stats.total;
    } else {
      count = stats.byType[rule.operationType] || 0;
    }
    
    const isCompleted = completedKeys.has(rule.achievementKey);
    const percentage = Math.min(100, Math.round((count / rule.requiredCount) * 100));
    
    return {
      achievementKey: rule.achievementKey,
      description: rule.description,
      currentCount: count,
      requiredCount: rule.requiredCount,
      percentage,
      isCompleted
    };
  });
}

// Export rules for UI display
export { ACHIEVEMENT_RULES };
