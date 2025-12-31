import { supabase, Achievement, VerificationNode, SupabaseError } from './supabase-client';
import { AchievementBlockchain } from '../achievement-system';

/**
 * Award achievement to user and save to Supabase
 */
export async function awardAchievementToDB(
  userId: string,
  achievementData: {
    achievement_id: string;
    title: string;
    title_tr: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    points: number;
    category: string;
    icon?: string;
  },
  blockchainNode?: VerificationNode
): Promise<Achievement | null> {
  try {
    // Generate blockchain hash if not provided
    const blockchain = new AchievementBlockchain();
    const hash = blockchain.generateHash(JSON.stringify(achievementData));
    
    const verificationChain: VerificationNode[] = blockchainNode 
      ? [blockchainNode]
      : [{
          id: `node-${Date.now()}`,
          timestamp: new Date().toISOString(),
          hash,
          previousHash: '0',
          hmacSignature: blockchain.createVerificationNode(achievementData).hmacSignature,
        }];

    const { data, error } = await supabase
      .from('achievements')
      .insert([
        {
          user_id: userId,
          achievement_id: achievementData.achievement_id,
          title: achievementData.title,
          title_tr: achievementData.title_tr,
          rarity: achievementData.rarity,
          points: achievementData.points,
          category: achievementData.category,
          icon: achievementData.icon,
          blockchain_hash: hash,
          verification_chain: verificationChain,
          is_publicly_displayed: true,
        },
      ])
      .select()
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_INSERT_ERROR');
    
    console.log('✅ Achievement saved to database:', data);
    return data;
  } catch (error) {
    console.error('❌ Error awarding achievement:', error);
    return null;
  }
}

/**
 * Get user's achievements from Supabase
 */
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('awarded_at', { ascending: false });

    if (error) throw new SupabaseError(error.message, 'DB_FETCH_ERROR');
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching achievements:', error);
    return [];
  }
}

/**
 * Get public achievements (for profile showcase)
 */
export async function getPublicAchievements(userId: string): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('is_publicly_displayed', true)
      .order('awarded_at', { ascending: false });

    if (error) throw new SupabaseError(error.message, 'DB_FETCH_ERROR');
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching public achievements:', error);
    return [];
  }
}

/**
 * Update achievement visibility
 */
export async function updateAchievementVisibility(
  achievementId: string,
  isPublic: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('achievements')
      .update({ is_publicly_displayed: isPublic })
      .eq('id', achievementId);

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    console.log('✅ Achievement visibility updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating visibility:', error);
    return false;
  }
}

/**
 * Verify achievement blockchain integrity
 */
export async function verifyAchievementChain(achievementId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('blockchain_hash, verification_chain')
      .eq('id', achievementId)
      .single();

    if (error) throw new SupabaseError(error.message, 'DB_FETCH_ERROR');
    
    const blockchain = new AchievementBlockchain();
    const isValid = blockchain.verifyChain(data.verification_chain, data.blockchain_hash);
    
    console.log(`${isValid ? '✅' : '❌'} Chain verification: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying chain:', error);
    return false;
  }
}

/**
 * Add custom message to achievement
 */
export async function addAchievementNote(
  achievementId: string,
  message: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('achievements')
      .update({ custom_message: message })
      .eq('id', achievementId);

    if (error) throw new SupabaseError(error.message, 'DB_UPDATE_ERROR');
    
    return true;
  } catch (error) {
    console.error('❌ Error adding note:', error);
    return false;
  }
}

/**
 * Get achievement statistics for user
 */
export async function getAchievementBreakdown(userId: string) {
  try {
    const achievements = await getUserAchievements(userId);
    
    const stats = {
      total: achievements.length,
      byRarity: {
        common: achievements.filter(a => a.rarity === 'common').length,
        uncommon: achievements.filter(a => a.rarity === 'uncommon').length,
        rare: achievements.filter(a => a.rarity === 'rare').length,
        epic: achievements.filter(a => a.rarity === 'epic').length,
        legendary: achievements.filter(a => a.rarity === 'legendary').length,
      },
      byCategory: {} as Record<string, number>,
      totalPoints: 0,
    };

    achievements.forEach(ach => {
      stats.byCategory[ach.category] = (stats.byCategory[ach.category] || 0) + 1;
      stats.totalPoints += ach.points;
    });

    return stats;
  } catch (error) {
    console.error('❌ Error getting breakdown:', error);
    return null;
  }
}

/**
 * Export user achievements as NFT metadata
 */
export async function exportAchievementsAsNFT(userId: string) {
  try {
    const achievements = await getPublicAchievements(userId);
    const stats = await getAchievementBreakdown(userId);

    const nftMetadata = {
      version: '1.0',
      owner: userId,
      exportDate: new Date().toISOString(),
      totalAchievements: achievements.length,
      statistics: stats,
      achievements: achievements.map((ach, idx) => ({
        rank: idx + 1,
        id: ach.achievement_id,
        title: ach.title,
        title_tr: ach.title_tr,
        rarity: ach.rarity,
        points: ach.points,
        category: ach.category,
        icon: ach.icon,
        awardedAt: ach.awarded_at,
        blockchainHash: ach.blockchain_hash,
        verificationNodesCount: ach.verification_chain?.length || 0,
      })),
    };

    return nftMetadata;
  } catch (error) {
    console.error('❌ Error exporting achievements:', error);
    return null;
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Bulk award achievements to user
 */
export async function bulkAwardAchievements(
  userId: string,
  achievements: Array<{
    achievement_id: string;
    title: string;
    title_tr: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    points: number;
    category: string;
    icon?: string;
  }>
): Promise<Achievement[]> {
  try {
    const blockchain = new AchievementBlockchain();
    const timestamp = new Date().toISOString();
    
    const records = achievements.map((ach) => {
      const hash = blockchain.generateHash(JSON.stringify(ach));
      const node = blockchain.createVerificationNode(ach);
      
      return {
        user_id: userId,
        achievement_id: ach.achievement_id,
        title: ach.title,
        title_tr: ach.title_tr,
        rarity: ach.rarity,
        points: ach.points,
        category: ach.category,
        icon: ach.icon,
        blockchain_hash: hash,
        verification_chain: [{
          id: `node-${Date.now()}-${Math.random()}`,
          timestamp,
          hash,
          previousHash: '0',
          hmacSignature: node.hmacSignature,
        }],
        is_publicly_displayed: true,
      };
    });

    const { data, error } = await supabase
      .from('achievements')
      .insert(records)
      .select();

    if (error) throw new SupabaseError(error.message, 'DB_BATCH_INSERT_ERROR');
    
    console.log(`✅ Bulk awarded ${data?.length || 0} achievements`);
    return data || [];
  } catch (error) {
    console.error('❌ Error bulk awarding achievements:', error);
    return [];
  }
}
