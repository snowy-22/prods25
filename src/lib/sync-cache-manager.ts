/**
 * Sync & Cache Manager
 * Cross-device folder synchronization with optimized caching
 * 
 * Features:
 * - LRU Cache with TTL for folders and items
 * - Cloud-first sync strategy
 * - Automatic cache invalidation
 * - Real-time change propagation
 * - Local storage cleanup utilities
 */

import { createClient } from '@/lib/supabase/client';
import { ContentItem } from './initial-content';
import { getDeviceId } from './supabase-sync';

// ==================== Types ====================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
  deviceId: string;
}

export interface FolderSyncState {
  folderId: string;
  lastSyncAt: string;
  itemCount: number;
  version: number;
  status: 'synced' | 'pending' | 'error' | 'stale';
}

export interface SyncResult {
  success: boolean;
  itemsAdded: number;
  itemsUpdated: number;
  itemsRemoved: number;
  timestamp: string;
  fromCache: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  oldestEntry: number;
  newestEntry: number;
}

// ==================== LRU Cache Implementation ====================

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    oldestEntry: Date.now(),
    newestEntry: Date.now(),
  };

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.stats.hits++;
    
    return entry.data;
  }

  set(key: string, data: T, ttl?: number, version: number = 1): void {
    // Evict LRU if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      version,
      deviceId: getDeviceId(),
    };
    
    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
    this.stats.newestEntry = Date.now();
  }

  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats, size: this.cache.size };
  }

  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  getEntry(key: string): CacheEntry<T> | null {
    return this.cache.get(key) || null;
  }
}

// ==================== Global Cache Instances ====================

// Folder content cache (items within folders)
export const folderContentCache = new LRUCache<ContentItem[]>(50, 3 * 60 * 1000); // 3 min TTL

// Folder metadata cache
export const folderMetaCache = new LRUCache<FolderSyncState>(100, 10 * 60 * 1000); // 10 min TTL

// User data cache
export const userDataCache = new LRUCache<any>(20, 5 * 60 * 1000); // 5 min TTL

// Search history cache
export const searchCache = new LRUCache<any[]>(30, 15 * 60 * 1000); // 15 min TTL

// ==================== Local Storage Cleanup ====================

/**
 * Clear all personal folder data from localStorage
 */
export function clearLocalFolderCache(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('folder_') ||
      key.startsWith('folder-cache_') ||
      key.startsWith('folder-items_') ||
      key.startsWith('personal_folders') ||
      key.includes('folderContent') ||
      key.includes('folderCache')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`✓ Cleared ${keysToRemove.length} folder cache entries from localStorage`);
}

/**
 * Clear browser history and search data from localStorage
 */
export function clearBrowserHistory(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('browser_history') ||
      key.startsWith('search_history') ||
      key.startsWith('navigation_history') ||
      key.includes('browserHistory') ||
      key.includes('searchHistory') ||
      key.includes('recentSearches')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`✓ Cleared ${keysToRemove.length} browser history entries from localStorage`);
}

/**
 * Clear all sync-related local storage but keep essential app state
 */
export function clearSyncCache(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('sync_') ||
      key.startsWith('cache_') ||
      key.startsWith('cloud_') ||
      key.includes('lastSync') ||
      key.includes('syncState')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`✓ Cleared ${keysToRemove.length} sync cache entries from localStorage`);
}

/**
 * Clear all caches (memory + localStorage) for fresh start
 */
export function clearAllCaches(): void {
  // Memory caches
  folderContentCache.clear();
  folderMetaCache.clear();
  userDataCache.clear();
  searchCache.clear();
  
  // localStorage caches
  clearLocalFolderCache();
  clearBrowserHistory();
  clearSyncCache();
  
  // Also clear migration flags to force re-sync
  const migrationKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('migration_done_')) {
      migrationKeys.push(key);
    }
  }
  migrationKeys.forEach(key => localStorage.removeItem(key));
  
  console.log('✓ All caches cleared - ready for fresh sync from cloud');
}

/**
 * Reset app to initial state (clears everything including store)
 */
export function resetToInitialState(): void {
  clearAllCaches();
  
  // Remove main app storage (this will reset zustand store)
  localStorage.removeItem('tv25-storage');
  
  // Keep device_id for consistency
  // Keep auth tokens
  
  console.log('✓ App reset to initial state');
}

// ==================== Cross-Device Folder Sync ====================

/**
 * Load folders from cloud (cloud-first approach)
 */
export async function loadFoldersFromCloud(userId: string): Promise<ContentItem[]> {
  try {
    const supabase = createClient();
    
    // Check cache first
    const cacheKey = `folders_${userId}`;
    const cached = folderContentCache.get(cacheKey);
    if (cached) {
      console.log('✓ Folders loaded from cache');
      return cached;
    }
    
    // Load from cloud
    const { data, error } = await supabase
      .from('folder_items_cloud')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Extract ContentItems from cloud data
    const folders: ContentItem[] = (data || []).map(item => item.item_data as ContentItem);
    
    // Cache the result
    folderContentCache.set(cacheKey, folders);
    
    console.log(`✓ Loaded ${folders.length} folders from cloud`);
    return folders;
  } catch (error) {
    console.error('Failed to load folders from cloud:', error);
    return [];
  }
}

/**
 * Load specific folder content from cloud
 */
export async function loadFolderContentFromCloud(
  userId: string,
  folderId: string
): Promise<ContentItem[]> {
  try {
    const supabase = createClient();
    
    // Check cache first
    const cacheKey = `folder_content_${userId}_${folderId}`;
    const cached = folderContentCache.get(cacheKey);
    if (cached) {
      console.log(`✓ Folder ${folderId} content loaded from cache`);
      return cached;
    }
    
    // Load from cloud
    const { data, error } = await supabase
      .from('folder_items_cloud')
      .select('*')
      .eq('user_id', userId)
      .eq('folder_id', folderId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Extract ContentItems
    const items: ContentItem[] = (data || []).map(item => item.item_data as ContentItem);
    
    // Cache the result
    folderContentCache.set(cacheKey, items);
    
    // Update folder meta
    folderMetaCache.set(`meta_${folderId}`, {
      folderId,
      lastSyncAt: new Date().toISOString(),
      itemCount: items.length,
      version: 1,
      status: 'synced',
    });
    
    console.log(`✓ Loaded ${items.length} items for folder ${folderId}`);
    return items;
  } catch (error) {
    console.error(`Failed to load folder ${folderId} content:`, error);
    return [];
  }
}

/**
 * Save folder content to cloud
 */
export async function saveFolderContentToCloud(
  userId: string,
  folderId: string,
  items: ContentItem[]
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsRemoved: 0,
    timestamp: new Date().toISOString(),
    fromCache: false,
  };
  
  try {
    const supabase = createClient();
    const deviceId = getDeviceId();
    
    // Get existing items in cloud for this folder
    const { data: existingData } = await supabase
      .from('folder_items_cloud')
      .select('item_id')
      .eq('user_id', userId)
      .eq('folder_id', folderId);
    
    const existingIds = new Set((existingData || []).map(d => d.item_id));
    const newIds = new Set(items.map(i => i.id));
    
    // Items to add/update
    const upsertItems = items.map(item => ({
      user_id: userId,
      folder_id: folderId,
      item_id: item.id,
      item_type: item.type,
      item_title: item.title || 'Untitled',
      item_data: item,
      size_bytes: JSON.stringify(item).length,
      device_id: deviceId,
    }));
    
    if (upsertItems.length > 0) {
      const { error } = await supabase
        .from('folder_items_cloud')
        .upsert(upsertItems, {
          onConflict: 'user_id,item_id',
        });
      
      if (error) throw error;
    }
    
    // Items to remove (exist in cloud but not in local)
    const idsToRemove = [...existingIds].filter(id => !newIds.has(id));
    if (idsToRemove.length > 0) {
      await supabase
        .from('folder_items_cloud')
        .delete()
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .in('item_id', idsToRemove);
    }
    
    // Invalidate cache
    folderContentCache.invalidate(`folder_content_${userId}_${folderId}`);
    folderContentCache.invalidate(`folders_${userId}`);
    
    result.success = true;
    result.itemsAdded = items.filter(i => !existingIds.has(i.id)).length;
    result.itemsUpdated = items.filter(i => existingIds.has(i.id)).length;
    result.itemsRemoved = idsToRemove.length;
    
    console.log(`✓ Synced folder ${folderId}: +${result.itemsAdded}, ~${result.itemsUpdated}, -${result.itemsRemoved}`);
    return result;
  } catch (error) {
    console.error(`Failed to save folder ${folderId} to cloud:`, error);
    return result;
  }
}

/**
 * Sync all personal folders to cloud
 */
export async function syncAllFoldersToCloud(
  userId: string,
  folders: ContentItem[]
): Promise<{ success: boolean; syncedCount: number }> {
  try {
    const supabase = createClient();
    const deviceId = getDeviceId();
    
    // Filter only folders
    const folderItems = folders.filter(f => f.type === 'folder');
    
    // Batch upsert all folders
    const upsertData = folderItems.map(folder => ({
      user_id: userId,
      folder_id: folder.parentId || 'root',
      item_id: folder.id,
      item_type: folder.type,
      item_title: folder.title || 'Untitled',
      item_data: folder,
      size_bytes: JSON.stringify(folder).length,
      device_id: deviceId,
    }));
    
    if (upsertData.length > 0) {
      const { error } = await supabase
        .from('folder_items_cloud')
        .upsert(upsertData, {
          onConflict: 'user_id,item_id',
        });
      
      if (error) throw error;
    }
    
    // Update sync status
    await supabase
      .from('storage_sync_status')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        last_sync_at: new Date().toISOString(),
        sync_status: 'synced',
        items_synced: folderItems.length,
        bytes_synced: upsertData.reduce((sum, d) => sum + d.size_bytes, 0),
      }, {
        onConflict: 'user_id,device_id',
      });
    
    // Invalidate cache
    folderContentCache.invalidate(`folders_${userId}`);
    
    console.log(`✓ Synced ${folderItems.length} folders to cloud`);
    return { success: true, syncedCount: folderItems.length };
  } catch (error) {
    console.error('Failed to sync folders to cloud:', error);
    return { success: false, syncedCount: 0 };
  }
}

// ==================== Real-time Sync Subscriptions ====================

let folderSyncChannel: any = null;

/**
 * Subscribe to folder changes across devices
 */
export function subscribeToFolderChanges(
  userId: string,
  onFolderChange: (payload: { action: string; folderId: string; items: ContentItem[] }) => void
): () => void {
  try {
    const supabase = createClient();
    const currentDeviceId = getDeviceId();
    
    // Unsubscribe from previous channel
    if (folderSyncChannel) {
      supabase.removeChannel(folderSyncChannel);
    }
    
    folderSyncChannel = supabase
      .channel(`folder-sync-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folder_items_cloud',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const record = payload.new as any;
          
          // Ignore changes from same device
          if (record?.device_id === currentDeviceId) {
            return;
          }
          
          console.log('🔄 Folder change detected from another device');
          
          // Invalidate cache for this folder
          if (record?.folder_id) {
            folderContentCache.invalidate(`folder_content_${userId}_${record.folder_id}`);
            folderContentCache.invalidate(`folders_${userId}`);
          }
          
          // Notify callback
          const items = record?.item_data ? [record.item_data] : [];
          onFolderChange({
            action: payload.eventType,
            folderId: record?.folder_id || '',
            items,
          });
        }
      )
      .subscribe((status) => {
        console.log('Folder sync subscription status:', status);
      });
    
    return () => {
      if (folderSyncChannel) {
        supabase.removeChannel(folderSyncChannel);
        folderSyncChannel = null;
      }
    };
  } catch (error) {
    console.error('Failed to subscribe to folder changes:', error);
    return () => {};
  }
}

// ==================== Messaging & Social Sync ====================

let messageSyncChannel: any = null;
let socialSyncChannel: any = null;

/**
 * Subscribe to message changes (real-time messaging)
 */
export function subscribeToMessageChanges(
  userId: string,
  onMessageChange: (payload: { conversationId: string; message: any; action: string }) => void
): () => void {
  try {
    const supabase = createClient();
    
    if (messageSyncChannel) {
      supabase.removeChannel(messageSyncChannel);
    }
    
    messageSyncChannel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const record = payload.new as any;
          onMessageChange({
            conversationId: record?.conversation_id || '',
            message: record,
            action: payload.eventType,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const record = payload.new as any;
          onMessageChange({
            conversationId: record?.id || '',
            message: null,
            action: `conversation_${payload.eventType}`,
          });
        }
      )
      .subscribe();
    
    return () => {
      if (messageSyncChannel) {
        supabase.removeChannel(messageSyncChannel);
        messageSyncChannel = null;
      }
    };
  } catch (error) {
    console.error('Failed to subscribe to message changes:', error);
    return () => {};
  }
}

/**
 * Subscribe to social feed changes
 */
export function subscribeToSocialChanges(
  userId: string,
  onSocialChange: (payload: { type: string; data: any }) => void
): () => void {
  try {
    const supabase = createClient();
    
    if (socialSyncChannel) {
      supabase.removeChannel(socialSyncChannel);
    }
    
    socialSyncChannel = supabase
      .channel(`social-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onSocialChange({
            type: payload.eventType,
            data: payload.new,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onSocialChange({
            type: `like_${payload.eventType}`,
            data: payload.new,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onSocialChange({
            type: `comment_${payload.eventType}`,
            data: payload.new,
          });
        }
      )
      .subscribe();
    
    return () => {
      if (socialSyncChannel) {
        supabase.removeChannel(socialSyncChannel);
        socialSyncChannel = null;
      }
    };
  } catch (error) {
    console.error('Failed to subscribe to social changes:', error);
    return () => {};
  }
}

// ==================== Initialize Full Sync ====================

/**
 * Initialize complete cross-device sync system
 */
export async function initializeCrossDeviceSync(
  userId: string,
  callbacks: {
    onFolderChange?: (payload: any) => void;
    onMessageChange?: (payload: any) => void;
    onSocialChange?: (payload: any) => void;
  }
): Promise<{
  success: boolean;
  unsubscribe: () => void;
  folders: ContentItem[];
}> {
  const unsubscribes: (() => void)[] = [];
  
  try {
    // 1. Clear stale caches
    clearSyncCache();
    
    // 2. Load folders from cloud
    const folders = await loadFoldersFromCloud(userId);
    
    // 3. Subscribe to folder changes
    if (callbacks.onFolderChange) {
      const unsub = subscribeToFolderChanges(userId, callbacks.onFolderChange);
      unsubscribes.push(unsub);
    }
    
    // 4. Subscribe to message changes
    if (callbacks.onMessageChange) {
      const unsub = subscribeToMessageChanges(userId, callbacks.onMessageChange);
      unsubscribes.push(unsub);
    }
    
    // 5. Subscribe to social changes
    if (callbacks.onSocialChange) {
      const unsub = subscribeToSocialChanges(userId, callbacks.onSocialChange);
      unsubscribes.push(unsub);
    }
    
    console.log('✓ Cross-device sync initialized');
    
    return {
      success: true,
      unsubscribe: () => unsubscribes.forEach(fn => fn()),
      folders,
    };
  } catch (error) {
    console.error('Failed to initialize cross-device sync:', error);
    return {
      success: false,
      unsubscribe: () => unsubscribes.forEach(fn => fn()),
      folders: [],
    };
  }
}

// ==================== Export Cache Stats ====================

export function getCacheStats(): {
  folderContent: CacheStats;
  folderMeta: CacheStats;
  userData: CacheStats;
  search: CacheStats;
} {
  return {
    folderContent: folderContentCache.getStats(),
    folderMeta: folderMetaCache.getStats(),
    userData: userDataCache.getStats(),
    search: searchCache.getStats(),
  };
}
