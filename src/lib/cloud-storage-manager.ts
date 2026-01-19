/**
 * Cloud Storage Management
 * Manages user storage quotas, folder items, and distribution across sessions
 */

import { createClient } from '@/lib/supabase/client';
import { ContentItem } from './initial-content';

export interface UserStorageQuota {
  id: string;
  user_id: string;
  quota_bytes: number;
  used_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface FolderItemCloud {
  id: string;
  user_id: string;
  folder_id: string;
  item_id: string;
  item_type: string;
  item_title: string;
  item_data: any;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface StorageDistribution {
  id: string;
  user_id: string;
  category: string; // 'videos', 'images', 'widgets', 'files', 'other'
  used_bytes: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface StorageTransaction {
  id: string;
  user_id: string;
  transaction_type: 'upload' | 'delete' | 'sync' | 'transfer';
  item_id: string;
  item_type: string;
  size_bytes: number;
  status: 'pending' | 'completed' | 'failed';
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface StorageSyncStatus {
  id: string;
  user_id: string;
  device_id: string;
  last_sync_at: string;
  sync_status: 'synced' | 'pending' | 'error';
  items_synced: number;
  bytes_synced: number;
  created_at: string;
  updated_at: string;
}

/**
 * Initialize or get user storage quota (1 GB per user)
 */
export async function initializeUserStorageQuota(userId: string): Promise<UserStorageQuota> {
  try {
    const supabase = createClient();

    // Check if quota already exists
    const { data: existing, error: selectError } = await supabase
      .from('user_storage_quotas')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Table might not exist yet - return default quota
    if (selectError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Storage quota table not available yet:', selectError.message || 'Unknown error');
      }
      return {
        id: 'local-default',
        user_id: userId,
        quota_bytes: 1073741824, // 1 GB
        used_bytes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    if (existing) return existing;

    // Create new quota (1 GB = 1,073,741,824 bytes)
    const { data, error } = await supabase
      .from('user_storage_quotas')
      .insert({
        user_id: userId,
        quota_bytes: 1073741824, // 1 GB
        used_bytes: 0,
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not create storage quota:', error.message || 'Unknown error');
      }
      return {
        id: 'local-default',
        user_id: userId,
        quota_bytes: 1073741824, // 1 GB
        used_bytes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return data;
  } catch (error) {
    // Gracefully handle when table doesn't exist
    if (process.env.NODE_ENV === 'development') {
      console.warn('Storage quota unavailable, using defaults');
    }
    return {
      id: 'local-default',
      user_id: userId,
      quota_bytes: 1073741824, // 1 GB
      used_bytes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Get user storage quota
 */
export async function getUserStorageQuota(userId: string): Promise<UserStorageQuota> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_storage_quotas')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to handle no rows

    if (error) {
      console.error('Error fetching storage quota:', error);
      throw error;
    }

    // Initialize if doesn't exist
    if (!data) {
      console.log('No storage quota found, initializing...');
      return await initializeUserStorageQuota(userId);
    }

    return data;
  } catch (error) {
    // Return default quota when table doesn't exist
    if (process.env.NODE_ENV === 'development') {
      console.warn('Storage quota unavailable, using defaults');
    }
    return {
      id: 'local-default',
      user_id: userId,
      quota_bytes: 1073741824, // 1 GB
      used_bytes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Save folder item to cloud
 */
export async function saveFolderItemToCloud(
  userId: string,
  folderId: string,
  item: ContentItem,
  sizeBytes: number = 0
): Promise<FolderItemCloud> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('folder_items_cloud')
      .upsert({
        user_id: userId,
        folder_id: folderId,
        item_id: item.id,
        item_type: item.type,
        item_title: item.title,
        item_data: item,
        size_bytes: sizeBytes,
      }, {
        onConflict: 'user_id,item_id',
      })
      .select()
      .single();

    if (error) throw error;

    // Update storage usage
    await updateStorageUsage(userId, item.type, sizeBytes);

    return data;
  } catch (error) {
    console.error('Failed to save folder item to cloud:', error);
    throw error;
  }
}

/**
 * Save multiple folder items to cloud
 */
export async function saveFolderItemsToCloud(
  userId: string,
  folderId: string,
  items: { item: ContentItem; sizeBytes?: number }[]
): Promise<FolderItemCloud[]> {
  try {
    const supabase = createClient();

    const data = items.map(({ item, sizeBytes }) => ({
      user_id: userId,
      folder_id: folderId,
      item_id: item.id,
      item_type: item.type,
      item_title: item.title,
      item_data: item,
      size_bytes: sizeBytes || 0,
    }));

    const { data: result, error } = await supabase
      .from('folder_items_cloud')
      .upsert(data, {
        onConflict: 'user_id,item_id',
      })
      .select();

    if (error) throw error;

    // Update storage distributions
    for (const item of items) {
      await updateStorageUsage(userId, item.item.type, item.sizeBytes || 0);
    }

    return result;
  } catch (error) {
    console.error('Failed to save folder items to cloud:', error);
    throw error;
  }
}

/**
 * Load folder items from cloud
 */
export async function loadFolderItemsFromCloud(
  userId: string,
  folderId: string
): Promise<FolderItemCloud[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('folder_items_cloud')
      .select('*')
      .eq('user_id', userId)
      .eq('folder_id', folderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to load folder items from cloud:', error);
    throw error;
  }
}

/**
 * Load all personal folder items
 */
export async function loadAllPersonalFolderItems(userId: string): Promise<FolderItemCloud[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('folder_items_cloud')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to load personal folder items:', error);
    throw error;
  }
}

/**
 * Delete folder item from cloud
 */
export async function deleteFolderItemFromCloud(
  userId: string,
  itemId: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    // Get item first to know its size and type
    const { data: item, error: getError } = await supabase
      .from('folder_items_cloud')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (getError) throw getError;

    // Delete item
    const { error } = await supabase
      .from('folder_items_cloud')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId);

    if (error) throw error;

    // Update storage usage
    if (item) {
      await updateStorageUsage(userId, item.item_type, -item.size_bytes);
    }

    return true;
  } catch (error) {
    console.error('Failed to delete folder item from cloud:', error);
    throw error;
  }
}

/**
 * Update storage usage and distribution
 */
export async function updateStorageUsage(
  userId: string,
  itemType: string,
  bytesChange: number
): Promise<void> {
  try {
    const supabase = createClient();

    // Determine category
    const categoryMap: Record<string, string> = {
      video: 'videos',
      audio: 'videos',
      youtube: 'videos',
      image: 'images',
      widget: 'widgets',
      folder: 'other',
      player: 'videos',
      '3dplayer': 'videos',
      note: 'files',
      todo: 'files',
    };

    const category = categoryMap[itemType] || 'other';

    // Update quota
    const { data: quota } = await supabase
      .from('user_storage_quotas')
      .select('used_bytes')
      .eq('user_id', userId)
      .single();

    if (quota) {
      const newUsed = Math.max(0, quota.used_bytes + bytesChange);
      await supabase
        .from('user_storage_quotas')
        .update({ used_bytes: newUsed })
        .eq('user_id', userId);
    }

    // Update distribution
    const { data: dist } = await supabase
      .from('storage_distribution')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (dist) {
      const newUsed = Math.max(0, dist.used_bytes + bytesChange);
      const newCount = bytesChange > 0 ? dist.item_count + 1 : Math.max(0, dist.item_count - 1);
      await supabase
        .from('storage_distribution')
        .update({ used_bytes: newUsed, item_count: newCount })
        .eq('user_id', userId)
        .eq('category', category);
    } else {
      // Create new distribution record
      await supabase
        .from('storage_distribution')
        .insert({
          user_id: userId,
          category,
          used_bytes: Math.max(0, bytesChange),
          item_count: bytesChange > 0 ? 1 : 0,
        });
    }
  } catch (error) {
    console.error('Failed to update storage usage:', error);
  }
}

/**
 * Get storage distribution
 */
export async function getStorageDistribution(userId: string): Promise<StorageDistribution[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('storage_distribution')
      .select('*')
      .eq('user_id', userId)
      .order('used_bytes', { ascending: false });

    if (error) {
      // Table might not exist yet
      if (process.env.NODE_ENV === 'development') {
        console.warn('Storage distribution table unavailable');
      }
      return [];
    }
    return data || [];
  } catch (error) {
    // Return empty array when table doesn't exist
    if (process.env.NODE_ENV === 'development') {
      console.warn('Storage distribution unavailable');
    }
    return [];
  }
}

/**
 * Sync folder items across all devices
 */
export async function syncFolderItemsAcrossDevices(
  userId: string,
  deviceId: string,
  folderId: string
): Promise<{ synced: FolderItemCloud[]; itemCount: number; bytesCount: number }> {
  try {
    const supabase = createClient();

    // Load items from cloud
    const items = await loadFolderItemsFromCloud(userId, folderId);

    // Update sync status
    const { error: syncError } = await supabase
      .from('storage_sync_status')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        last_sync_at: new Date().toISOString(),
        sync_status: 'synced',
        items_synced: items.length,
        bytes_synced: items.reduce((sum, item) => sum + item.size_bytes, 0),
      }, {
        onConflict: 'user_id,device_id',
      });

    if (syncError) throw syncError;

    return {
      synced: items,
      itemCount: items.length,
      bytesCount: items.reduce((sum, item) => sum + item.size_bytes, 0),
    };
  } catch (error) {
    console.error('Failed to sync folder items:', error);
    throw error;
  }
}

/**
 * Get sync status across devices
 */
export async function getSyncStatus(userId: string): Promise<StorageSyncStatus[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('storage_sync_status')
      .select('*')
      .eq('user_id', userId)
      .order('last_sync_at', { ascending: false });

    if (error) {
      // Table might not exist yet
      if (process.env.NODE_ENV === 'development') {
        console.warn('Sync status table unavailable');
      }
      return [];
    }
    return data || [];
  } catch (error) {
    // Return empty array when table doesn't exist
    if (process.env.NODE_ENV === 'development') {
      console.warn('Sync status unavailable');
    }
    return [];
  }
}

/**
 * Get storage analytics
 */
export async function getStorageAnalytics(
  userId: string
): Promise<{
  quota: UserStorageQuota;
  distribution: StorageDistribution[];
  syncStatus: StorageSyncStatus[];
  usagePercent: number;
  availableBytes: number;
}> {
  try {
    const quota = await getUserStorageQuota(userId);
    const distribution = await getStorageDistribution(userId);
    const syncStatus = await getSyncStatus(userId);

    const usagePercent = (quota.used_bytes / quota.quota_bytes) * 100;
    const availableBytes = quota.quota_bytes - quota.used_bytes;

    return {
      quota,
      distribution,
      syncStatus,
      usagePercent,
      availableBytes,
    };
  } catch (error) {
    // Return default analytics when tables don't exist
    if (process.env.NODE_ENV === 'development') {
      console.warn('Storage analytics unavailable, using defaults');
    }
    const defaultQuota: UserStorageQuota = {
      id: 'local-default',
      user_id: userId,
      quota_bytes: 1073741824, // 1 GB
      used_bytes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return {
      quota: defaultQuota,
      distribution: [],
      syncStatus: [],
      usagePercent: 0,
      availableBytes: 1073741824,
    };
  }
}

/**
 * Subscribe to storage changes
 */
export function subscribeToStorageChanges(
  userId: string,
  callback: (payload: any) => void
) {
  try {
    const supabase = createClient();

    const channel = supabase
      .channel(`storage-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folder_items_cloud',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Failed to subscribe to storage changes:', error);
    return () => {};
  }
}
