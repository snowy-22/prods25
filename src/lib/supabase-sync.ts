/**
 * Supabase Real-time Sync
 * Syncs user canvas data across devices and browsers in real-time
 */

import { createClient } from '@/lib/supabase/client';
import { Tab, NewTabBehavior, StartupBehavior } from './store';
import { RealtimeChannel } from '@supabase/supabase-js';
import { GridModeState } from './layout-engine';
import { syncLogger } from './logger';

export type SyncDataType = 'tabs' | 'layout' | 'settings' | 'expanded_items';

export interface UserCanvasData {
  id: string;
  user_id: string;
  data_type: SyncDataType;
  data: any;
  version: number;
  device_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  layout_mode: 'grid' | 'canvas';
  new_tab_behavior: NewTabBehavior;
  startup_behavior: StartupBehavior;
  grid_mode_state?: GridModeState;
  ui_settings?: {
    isSecondLeftSidebarOpen?: boolean;
    activeSecondaryPanel?: string;
    pointerFrameEnabled?: boolean;
    audioTrackerEnabled?: boolean;
    mouseTrackerEnabled?: boolean;
    virtualizerMode?: boolean;
    visualizerMode?: string;
  };
  created_at: string;
  updated_at: string;
}

let realtimeChannel: RealtimeChannel | null = null;
let deviceId: string | null = null;

/**
 * Internal helpers to ensure Supabase is properly configured on the client.
 * Prevents noisy errors when env vars are missing or placeholders are used.
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Treat placeholder or empty values as not configured
  return !!url && !!key && url !== 'https://placeholder.supabase.co' && key !== 'placeholder';
}

/**
 * Get or generate device ID for conflict resolution
 */
export function getDeviceId(): string {
  if (deviceId) return deviceId;
  
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('device_id', id);
  }
  deviceId = id;
  return id;
}

/**
 * Save canvas data to Supabase
 */
export async function saveCanvasData(
  dataType: SyncDataType,
  data: any,
  userId: string
): Promise<boolean> {
  try {
    if (!isSupabaseConfigured() || !userId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Skip saveCanvasData: Supabase not configured or missing userId');
      }
      return false;
    }
    const supabase = createClient();
    const currentDeviceId = getDeviceId();

    const { error } = await supabase
      .from('user_canvas_data')
      .upsert({
        user_id: userId,
        data_type: dataType,
        data,
        device_id: currentDeviceId,
      }, {
        onConflict: 'user_id,data_type',
      });

    if (error) {
      const msg = (error as any)?.message;
      if (typeof msg === 'string' && msg.trim()) {
        syncLogger.error('Failed to save canvas data', error);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to save canvas data (no message).');
      }
      return false;
    }

    return true;
  } catch (error) {
    syncLogger.error('Error saving canvas data', error);
    return false;
  }
}

/**
 * Load canvas data from Supabase
 */
export async function loadCanvasData(
  dataType: SyncDataType,
  userId: string
): Promise<any | null> {
  try {
    if (!isSupabaseConfigured() || !userId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Skip loadCanvasData: Supabase not configured or missing userId');
      }
      return null;
    }
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_canvas_data')
      .select('*')
      .eq('user_id', userId)
      .eq('data_type', dataType)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        // No data found, return null
        return null;
      }
      const msg = (error as any)?.message;
      if (typeof msg === 'string' && msg.trim()) {
        syncLogger.error('Failed to load canvas data', error);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to load canvas data (no message).');
      }
      return null;
    }

    return data?.data || null;
  } catch (error) {
    syncLogger.error('Error loading canvas data', error);
    return null;
  }
}

/**
 * Load all canvas data for a user
 */
export async function loadAllCanvasData(userId: string): Promise<{
  tabs?: Tab[];
  expandedItems?: string[];
  settings?: any;
  layout?: any;
} | null> {
  try {
    if (!isSupabaseConfigured() || !userId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Skip loadAllCanvasData: Supabase not configured or missing userId');
      }
      return null;
    }
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_canvas_data')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      const msg = (error as any)?.message;
      // Only log if there's a meaningful error message (not empty object)
      if (typeof msg === 'string' && msg.trim() && process.env.NODE_ENV === 'development') {
        console.error('Failed to load all canvas data:', error);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to load all canvas data (no message).');
      }
      return null;
    }

    const result: any = {};
    data?.forEach(item => {
      result[item.data_type] = item.data;
    });

    return result;
  } catch (error) {
    console.error('Error loading all canvas data:', error);
    return null;
  }
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> {
  try {
    if (!isSupabaseConfigured() || !userId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Skip saveUserPreferences: Supabase not configured or missing userId');
      }
      return false;
    }
    const supabase = createClient();

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      const msg = (error as any)?.message;
      if (typeof msg === 'string' && msg.trim()) {
        console.error('Failed to save user preferences:', error);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to save user preferences (no message).');
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
}

/**
 * Load user preferences
 */
export async function loadUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    if (!isSupabaseConfigured() || !userId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Skip loadUserPreferences: Supabase not configured or missing userId');
      }
      return null;
    }
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null;
      }
      // Only log if there's a meaningful error message (not empty object)
      const msg = (error as any)?.message;
      if (typeof msg === 'string' && msg.trim() && process.env.NODE_ENV === 'development') {
        console.error('Failed to load user preferences:', error);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to load user preferences (no message).');
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return null;
  }
}

/**
 * Subscribe to real-time changes
 */
export function subscribeToCanvasChanges(
  userId: string,
  onUpdate: (payload: { dataType: SyncDataType; data: any; version: number; deviceId?: string }) => void
): RealtimeChannel {
  const supabase = createClient();

  // Unsubscribe from previous channel if exists
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  const currentDeviceId = getDeviceId();

  const channel = supabase
    .channel('canvas-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_canvas_data',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newRecord = payload.new as UserCanvasData;
        
        // Ignore updates from the same device to prevent loops
        if (newRecord.device_id === currentDeviceId) {
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('Realtime update received:', {
            type: newRecord.data_type,
            version: newRecord.version,
            from: newRecord.device_id,
          });
        }

        onUpdate({
          dataType: newRecord.data_type,
          data: newRecord.data,
          version: newRecord.version,
          deviceId: newRecord.device_id,
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_preferences',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newRecord = payload.new as UserPreferences;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Preferences update received:', newRecord);
        }

        onUpdate({
          dataType: 'settings',
          data: newRecord,
          version: 0,
        });
      }
    )
    .subscribe((status) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Realtime subscription status:', status);
      }
    });

  realtimeChannel = channel;
  return channel;
}

/**
 * Unsubscribe from real-time changes
 */
export function unsubscribeFromCanvasChanges(): void {
  if (realtimeChannel) {
    const supabase = createClient();
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

/**
 * Migrate local storage data to Supabase
 */
export async function migrateLocalStorageToCloud(userId: string): Promise<boolean> {
  try {
    // Check if migration already done
    const migrationKey = `migration_done_${userId}`;
    if (localStorage.getItem(migrationKey)) {
      return true;
    }

    // If Supabase is not configured, avoid noisy failures; mark as done.
    if (!isSupabaseConfigured() || !userId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Skip migration: Supabase not configured or missing userId');
      }
      localStorage.setItem(migrationKey, 'true');
      return true;
    }

    const localData = localStorage.getItem('tv25-storage');
    if (!localData) {
      localStorage.setItem(migrationKey, 'true');
      return true;
    }

    const parsed = JSON.parse(localData);
    const state = parsed.state;

    // Migrate tabs
    if (state.tabs) {
      await saveCanvasData('tabs', state.tabs, userId);
    }

    // Migrate expanded items
    if (state.expandedItems) {
      await saveCanvasData('expanded_items', state.expandedItems, userId);
    }

    // Migrate preferences
    const prefsSaved = await saveUserPreferences(userId, {
      layout_mode: state.layoutMode,
      new_tab_behavior: state.newTabBehavior,
      startup_behavior: state.startupBehavior,
      grid_mode_state: state.gridModeState,
      ui_settings: {
        isSecondLeftSidebarOpen: state.isSecondLeftSidebarOpen,
        activeSecondaryPanel: state.activeSecondaryPanel,
        pointerFrameEnabled: state.pointerFrameEnabled,
        audioTrackerEnabled: state.audioTrackerEnabled,
        mouseTrackerEnabled: state.mouseTrackerEnabled,
        virtualizerMode: state.virtualizerMode,
        visualizerMode: state.visualizerMode,
      },
    });

    // Mark migration as done even if prefs failed (to prevent loops on startup)
    if (!prefsSaved && process.env.NODE_ENV === 'development') {
      console.warn('Preferences save failed during migration; continuing without blocking.');
    }
    localStorage.setItem(migrationKey, 'true');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Local storage migrated to cloud successfully');
    }

    return true;
  } catch (error) {
    console.error('Error migrating local storage:', error);
    return false;
  }
}

/**
 * Sync local changes to cloud (debounced)
 */
let syncTimeouts: Record<string, NodeJS.Timeout> = {};

export function debouncedSyncToCloud(
  dataType: SyncDataType,
  data: any,
  userId: string,
  delay: number = 1000
): void {
  // Clear existing timeout for this data type
  if (syncTimeouts[dataType]) {
    clearTimeout(syncTimeouts[dataType]);
  }

  // Set new timeout
  syncTimeouts[dataType] = setTimeout(() => {
    saveCanvasData(dataType, data, userId);
  }, delay);
}

/**
 * Toolkit-specific sync functions (stubs for now)
 * These will be implemented when toolkit features are enabled
 */

export async function syncKeyboardShortcuts(userId: string, shortcuts: any[]): Promise<void> {
  // TODO: Implement keyboard shortcuts sync
  console.log('Syncing keyboard shortcuts for user:', userId);
}

export async function syncGestures(userId: string, gestures: any[]): Promise<void> {
  // TODO: Implement gestures sync
  console.log('Syncing gestures for user:', userId);
}

export async function syncMacros(userId: string, macros: any[]): Promise<void> {
  // TODO: Implement macros sync
  console.log('Syncing macros for user:', userId);
}

export async function syncMacroPads(userId: string, macroPads: any[]): Promise<void> {
  // TODO: Implement macro pads sync
  console.log('Syncing macro pads for user:', userId);
}

export async function syncPlayerControls(userId: string, controls: any[]): Promise<void> {
  // TODO: Implement player controls sync
  console.log('Syncing player controls for user:', userId);
}

export async function loadKeyboardShortcuts(userId: string): Promise<any[]> {
  // TODO: Implement keyboard shortcuts loading
  return [];
}

export async function loadGestures(userId: string): Promise<any[]> {
  // TODO: Implement gestures loading
  return [];
}

export async function loadMacros(userId: string): Promise<any[]> {
  // TODO: Implement macros loading
  return [];
}

export async function loadMacroPads(userId: string): Promise<any[]> {
  // TODO: Implement macro pads loading
  return [];
}

export async function loadPlayerControls(userId: string): Promise<any[]> {
  // TODO: Implement player controls loading
  return [];
}

export function subscribeToToolkitChanges(userId: string, callback: (payload: any) => void): void {
  // TODO: Implement toolkit changes subscription
  console.log('Subscribing to toolkit changes for user:', userId);
}

// =====================================================
// COMPREHENSIVE LIVE DATA SYNC
// =====================================================

import { ContentItem } from './initial-content';

/**
 * Canvas Items (Folders, Lists, Grids, All Content) Sync
 */

export async function syncCanvasItem(userId: string, item: ContentItem): Promise<void> {
  const supabase = createClient();
  
  const itemData = {
    id: item.id,
    user_id: userId,
    parent_id: item.parentId || null,
    type: item.type,
    title: item.title || null,
    content: item.content || null,
    icon: item.icon || null,
    url: (item as any).url || null,
    thumbnail: (item as any).thumbnail || null,
    metadata: {
      description: (item as any).description,
      tags: (item as any).tags,
      category: (item as any).category,
      ...((item as any).metadata || {})
    },
    
    // Position & Layout
    x: item.x || null,
    y: item.y || null,
    width: item.width || null,
    height: item.height || null,
    grid_span_col: item.gridSpanCol || null,
    grid_span_row: item.gridSpanRow || null,
    layout_mode: item.layoutMode || null,
    
    // Styling
    styles: item.styles || {},
    frame_style: (item as any).frameStyle || null,
    border_style: (item as any).borderStyle || null,
    animation_preset: (item as any).animationPreset || null,
    
    // Hierarchy & Organization
    order: item.order || 0,
    is_expanded: false, // Will be tracked separately
    is_pinned: (item as any).isPinned || false,
    is_favorite: (item as any).isFavorite || false,
    is_archived: (item as any).isArchived || false,
    is_deletable: item.isDeletable !== false,
    
    updated_at: new Date().toISOString(),
    accessed_at: new Date().toISOString(),
    device_id: getDeviceId()
  };

  const { error } = await supabase
    .from('canvas_items')
    .upsert(itemData, { onConflict: 'id' });

  if (error) {
    console.error('Error syncing canvas item:', error);
  }
}

export async function syncCanvasItems(userId: string, items: ContentItem[]): Promise<void> {
  const supabase = createClient();
  
  const itemsData = items.map(item => ({
    id: item.id,
    user_id: userId,
    parent_id: item.parentId || null,
    type: item.type,
    title: item.title || null,
    content: item.content || null,
    icon: item.icon || null,
    url: (item as any).url || null,
    thumbnail: (item as any).thumbnail || null,
    metadata: {
      description: (item as any).description,
      tags: (item as any).tags,
      category: (item as any).category,
      ...((item as any).metadata || {})
    },
    x: item.x || null,
    y: item.y || null,
    width: item.width || null,
    height: item.height || null,
    grid_span_col: item.gridSpanCol || null,
    grid_span_row: item.gridSpanRow || null,
    layout_mode: item.layoutMode || null,
    styles: item.styles || {},
    frame_style: (item as any).frameStyle || null,
    border_style: (item as any).borderStyle || null,
    animation_preset: (item as any).animationPreset || null,
    order: item.order || 0,
    is_pinned: (item as any).isPinned || false,
    is_favorite: (item as any).isFavorite || false,
    is_archived: (item as any).isArchived || false,
    is_deletable: item.isDeletable !== false,
    updated_at: new Date().toISOString(),
    device_id: getDeviceId()
  }));

  // Batch upsert (max 1000 at a time)
  const batchSize = 1000;
  for (let i = 0; i < itemsData.length; i += batchSize) {
    const batch = itemsData.slice(i, i + batchSize);
    const { error } = await supabase
      .from('canvas_items')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing canvas items batch:', error);
    }
  }
}

export async function loadCanvasItems(userId: string): Promise<ContentItem[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('canvas_items')
    .select('*')
    .eq('user_id', userId)
    .order('order', { ascending: true });

  if (error) {
    console.error('Error loading canvas items:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    type: item.type,
    title: item.title,
    content: item.content,
    icon: item.icon,
    url: item.url,
    thumbnail: item.thumbnail,
    parentId: item.parent_id,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    gridSpanCol: item.grid_span_col,
    gridSpanRow: item.grid_span_row,
    layoutMode: item.layout_mode,
    styles: item.styles || {},
    frameStyle: item.frame_style,
    borderStyle: item.border_style,
    animationPreset: item.animation_preset,
    order: item.order,
    isPinned: item.is_pinned,
    isFavorite: item.is_favorite,
    isArchived: item.is_archived,
    isDeletable: item.is_deletable,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    metadata: item.metadata,
    ...item.metadata
  }));
}

/**
 * Search History Sync
 */

export async function saveSearchQuery(
  userId: string,
  query: string,
  searchType: 'general' | 'web' | 'youtube' | 'local' | 'ai' = 'general',
  resultsCount: number = 0,
  metadata: any = {}
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('search_history')
    .insert({
      user_id: userId,
      query,
      search_type: searchType,
      results_count: resultsCount,
      metadata,
      created_at: new Date().toISOString(),
      accessed_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving search query:', error);
  }
}

export async function loadSearchHistory(userId: string, limit: number = 50): Promise<any[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading search history:', error);
    return [];
  }

  return data || [];
}

export async function getPopularSearches(userId: string, limit: number = 10): Promise<any[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('get_popular_searches', {
      p_user_id: userId,
      p_limit: limit
    });

  if (error) {
    console.error('Error getting popular searches:', error);
    return [];
  }

  return data || [];
}

/**
 * AI Chat History Sync
 */

export async function saveAIConversation(
  userId: string,
  conversationId: string,
  title: string,
  contextItems: any[] = [],
  metadata: any = {}
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('ai_conversations')
    .upsert({
      id: conversationId,
      user_id: userId,
      title,
      context_items: contextItems,
      metadata,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (error) {
    console.error('Error saving AI conversation:', error);
  }
}

export async function saveAIMessage(
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  sequenceNumber: number,
  toolCalls: any[] = [],
  toolResults: any[] = [],
  metadata: any = {}
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      sequence_number: sequenceNumber,
      tool_calls: toolCalls,
      tool_results: toolResults,
      metadata,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving AI message:', error);
  }

  // Update conversation's last message timestamp
  await supabase
    .from('ai_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      total_messages: sequenceNumber + 1
    })
    .eq('id', conversationId);
}

export async function loadAIConversations(userId: string): Promise<any[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error loading AI conversations:', error);
    return [];
  }

  return data || [];
}

export async function loadAIMessages(conversationId: string): Promise<any[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sequence_number', { ascending: true });

  if (error) {
    console.error('Error loading AI messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Frame & Style Updates Sync
 */

export async function saveFrameStyleUpdate(
  userId: string,
  itemId: string,
  styleType: 'frame' | 'border' | 'animation' | 'background' | 'custom',
  previousValue: any,
  newValue: any,
  appliedBy: 'user' | 'ai' | 'preset' | 'system' = 'user',
  metadata: any = {}
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('frame_style_history')
    .insert({
      user_id: userId,
      item_id: itemId,
      style_type: styleType,
      previous_value: previousValue,
      new_value: newValue,
      applied_by: appliedBy,
      metadata,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving frame style update:', error);
  }
}

export async function loadFrameStyleHistory(
  userId: string,
  itemId?: string,
  limit: number = 50
): Promise<any[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('frame_style_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (itemId) {
    query = query.eq('item_id', itemId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading frame style history:', error);
    return [];
  }

  return data || [];
}

/**
 * Layout State Sync
 */

export async function saveLayoutState(
  userId: string,
  viewId: string,
  layoutMode: 'grid' | 'canvas' | 'list' | 'carousel' | 'presentation',
  gridColumns?: number,
  gridRows?: number,
  viewportSettings: any = {},
  zoomLevel: number = 1.0,
  scrollPosition: { x: number; y: number } = { x: 0, y: 0 },
  visibleItems: string[] = []
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('layout_states')
    .upsert({
      user_id: userId,
      view_id: viewId,
      layout_mode: layoutMode,
      grid_columns: gridColumns,
      grid_rows: gridRows,
      viewport_settings: viewportSettings,
      zoom_level: zoomLevel,
      scroll_position: scrollPosition,
      visible_items: visibleItems,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,view_id' });

  if (error) {
    console.error('Error saving layout state:', error);
  }
}

export async function loadLayoutState(userId: string, viewId: string): Promise<any | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('layout_states')
    .select('*')
    .eq('user_id', userId)
    .eq('view_id', viewId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // Not found error is ok
      console.error('Error loading layout state:', error);
    }
    return null;
  }

  return data;
}

/**
 * Interaction Tracking
 */

export async function trackInteraction(
  userId: string,
  itemId: string,
  interactionType: 'click' | 'hover' | 'select' | 'drag' | 'drop' | 'resize' | 'delete' | 'edit',
  durationMs?: number,
  metadata: any = {}
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('interaction_history')
    .insert({
      user_id: userId,
      item_id: itemId,
      interaction_type: interactionType,
      duration_ms: durationMs,
      metadata,
      created_at: new Date().toISOString()
    });

  if (error && process.env.NODE_ENV === 'development') {
    console.error('Error tracking interaction:', error);
  }
}

/**
 * Realtime Subscriptions
 */

let canvasItemsChannel: RealtimeChannel | null = null;
let searchHistoryChannel: RealtimeChannel | null = null;
let aiChatChannel: RealtimeChannel | null = null;

export function subscribeToCanvasItems(
  userId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = createClient();
  
  canvasItemsChannel = supabase
    .channel(`canvas_items:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'canvas_items',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    if (canvasItemsChannel) {
      canvasItemsChannel.unsubscribe();
      canvasItemsChannel = null;
    }
  };
}

export function subscribeToSearchHistory(
  userId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = createClient();
  
  searchHistoryChannel = supabase
    .channel(`search_history:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'search_history',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    if (searchHistoryChannel) {
      searchHistoryChannel.unsubscribe();
      searchHistoryChannel = null;
    }
  };
}

export function subscribeToAIChat(
  userId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = createClient();
  
  aiChatChannel = supabase
    .channel(`ai_chat:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ai_messages',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    if (aiChatChannel) {
      aiChatChannel.unsubscribe();
      aiChatChannel = null;
    }
  };
}

// =====================================================
// TRASH/RECYCLE BIN SYNC
// =====================================================

export async function moveToTrash(
  userId: string,
  itemId: string,
  item: any,
  reason?: string
) {
  const supabase = createClient();
  
  const trashItem = {
    id: `trash-${Date.now()}`,
    user_id: userId,
    original_id: itemId,
    item_type: item.type || 'item',
    title: item.title,
    metadata: {
      originalParentId: item.parentId,
      originalPosition: { x: item.x, y: item.y },
      deletionReason: reason || 'manual_delete'
    },
    content: item,
    tags: item.tags || []
  };

  const { error } = await supabase
    .from('trash_items')
    .insert([trashItem]);

  if (error) throw error;

  // Log to recovery log
  await supabase
    .from('recovery_logs')
    .insert([{
      id: `log-${Date.now()}`,
      trash_item_id: trashItem.id,
      user_id: userId,
      action: 'deleted',
      reason,
      timestamp: new Date().toISOString()
    }]);

  return trashItem;
}

export async function restoreFromTrash(
  userId: string,
  trashItemId: string,
  restorePosition?: { x: number; y: number }
) {
  const supabase = createClient();

  const { data: trashItem, error: fetchError } = await supabase
    .from('trash_items')
    .select('*')
    .eq('id', trashItemId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  // Restore the item content
  const restoredItem = {
    ...trashItem.content,
    x: restorePosition?.x ?? trashItem.metadata?.originalPosition?.x ?? 0,
    y: restorePosition?.y ?? trashItem.metadata?.originalPosition?.y ?? 0,
    parentId: trashItem.metadata?.originalParentId
  };

  // Update trash item with recovery info
  const { error: updateError } = await supabase
    .from('trash_items')
    .update({
      recovered_at: new Date().toISOString(),
      restoration_count: (trashItem.restoration_count || 0) + 1
    })
    .eq('id', trashItemId);

  if (updateError) throw updateError;

  // Log restoration
  await supabase
    .from('recovery_logs')
    .insert([{
      id: `log-${Date.now()}`,
      trash_item_id: trashItemId,
      user_id: userId,
      action: 'restored',
      restored_to: restorePosition ? `${restorePosition.x},${restorePosition.y}` : 'original',
      timestamp: new Date().toISOString()
    }]);

  return restoredItem;
}

export async function permanentlyDeleteTrash(
  userId: string,
  trashItemId: string
) {
  const supabase = createClient();

  // Mark for permanent deletion
  const { error: updateError } = await supabase
    .from('trash_items')
    .update({ permanent_delete_at: new Date().toISOString() })
    .eq('id', trashItemId)
    .eq('user_id', userId);

  if (updateError) throw updateError;

  // Log permanent deletion
  await supabase
    .from('recovery_logs')
    .insert([{
      id: `log-${Date.now()}`,
      trash_item_id: trashItemId,
      user_id: userId,
      action: 'permanently_deleted',
      timestamp: new Date().toISOString()
    }]);

  // Actually delete after logging
  await supabase
    .from('trash_items')
    .delete()
    .eq('id', trashItemId);
}

export async function loadTrashBucket(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('trash_items')
    .select('*')
    .eq('user_id', userId)
    .is('permanent_delete_at', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTrashStats(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_trash_stats', { p_user_id: userId });

  if (error) throw error;
  return data?.[0] || {};
}

let trashChannel: RealtimeChannel | null = null;

export function subscribeToTrashChanges(
  userId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = createClient();

  trashChannel = supabase
    .channel(`trash:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trash_items',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    if (trashChannel) {
      trashChannel.unsubscribe();
      trashChannel = null;
    }
  };
}

// =====================================================
// SCENES & PRESENTATIONS SYNC
// =====================================================

export async function saveScene(userId: string, scene: any) {
  const supabase = createClient();

  const sceneData = {
    ...scene,
    user_id: userId,
    updated_at: new Date().toISOString(),
    accessed_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('scenes')
    .upsert([sceneData], { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function loadPresentation(userId: string, presentationId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('presentations')
    .select(`
      *,
      scenes!inner(*)
    `)
    .eq('id', presentationId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function savePresentation(userId: string, presentation: any) {
  const supabase = createClient();

  const presentationData = {
    ...presentation,
    user_id: userId,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('presentations')
    .upsert([presentationData], { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPopularPresentations(userId: string, limit: number = 10) {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_popular_presentations', { p_user_id: userId, p_limit: limit });

  if (error) throw error;
  return data || [];
}

export async function getRecentScenes(userId: string, limit: number = 10) {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_recent_scenes', { p_user_id: userId, p_limit: limit });

  if (error) throw error;
  return data || [];
}

let sceneChannel: RealtimeChannel | null = null;
let presentationChannel: RealtimeChannel | null = null;
let multiTabSyncChannel: RealtimeChannel | null = null;
let socialEventsChannel: RealtimeChannel | null = null;
let messageDeliveryChannel: RealtimeChannel | null = null;

export function subscribeToSceneChanges(
  presentationId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = createClient();

  sceneChannel = supabase
    .channel(`scenes:${presentationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'scenes',
        filter: `presentation_id=eq.${presentationId}`
      },
      callback
    )
    .subscribe();

  return () => {
    if (sceneChannel) {
      sceneChannel.unsubscribe();
      sceneChannel = null;
    }
  };
}

export function subscribeToPresentationChanges(
  userId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = createClient();

  presentationChannel = supabase
    .channel(`presentations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'presentations',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    if (presentationChannel) {
      presentationChannel.unsubscribe();
      presentationChannel = null;
    }
  };
}

// =====================================================
// MULTI-TAB SYNC - TÜM SEKMELER ARASI SENKRONIZASYON
// =====================================================

export async function trackMultiTabSync(
  userId: string,
  deviceId: string,
  tabId: string,
  entityType: 'canvas_item' | 'visual_update' | 'layout_change' | 'style_update' | 'post' | 'comment' | 'like' | 'message' | 'shared_item',
  entityId: string,
  action: 'create' | 'update' | 'delete' | 'view',
  changeData?: any,
  previousState?: any,
  newState?: any
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('multi_tab_sync')
    .insert({
      user_id: userId,
      device_id: deviceId,
      tab_id: tabId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      change_data: changeData || {},
      previous_state: previousState,
      new_state: newState,
      sync_status: 'synced',
      synced_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToMultiTabSync(
  userId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = createClient();

  multiTabSyncChannel = supabase
    .channel(`multi_tab_sync:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'multi_tab_sync',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    if (multiTabSyncChannel) {
      multiTabSyncChannel.unsubscribe();
      multiTabSyncChannel = null;
    }
  };
}

// =====================================================
// SHARING SYSTEM - PAYLAŞIM SİSTEMİ
// =====================================================

export async function createSharedItem(
  userId: string,
  itemId: string,
  itemType: string
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('shared_items')
    .insert({
      owner_id: userId,
      item_id: itemId,
      item_type: itemType
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function grantSharingPermission(
  sharedItemId: string,
  granteeUserId: string | null,
  granteeEmail: string | null,
  role: 'viewer' | 'commenter' | 'editor' | 'owner',
  permissions: {
    canView: boolean;
    canComment: boolean;
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
  },
  grantedById: string,
  expiresAt?: string
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sharing_permissions')
    .insert({
      shared_item_id: sharedItemId,
      grantee_user_id: granteeUserId,
      grantee_email: granteeEmail,
      grantee_role: role,
      can_view: permissions.canView,
      can_comment: permissions.canComment,
      can_edit: permissions.canEdit,
      can_share: permissions.canShare,
      can_delete: permissions.canDelete,
      granted_by_id: grantedById,
      expires_at: expiresAt
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createSharingLink(
  sharedItemId: string,
  createdById: string,
  settings: {
    isPublic: boolean;
    allowDownload: boolean;
    allowPreview: boolean;
    allowComments: boolean;
    title?: string;
    description?: string;
    expiresAt?: string;
  }
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sharing_links')
    .insert({
      shared_item_id: sharedItemId,
      created_by_id: createdById,
      is_public: settings.isPublic,
      allow_download: settings.allowDownload,
      allow_preview: settings.allowPreview,
      allow_comments: settings.allowComments,
      title: settings.title,
      description: settings.description,
      expires_at: settings.expiresAt
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function logSharingAccess(
  sharingLinkId: string,
  userId: string | null,
  ipAddress: string | null,
  userAgent: string,
  action: 'view' | 'download' | 'comment' | 'share'
) {
  const supabase = createClient();

  const { error } = await supabase
    .from('sharing_access_log')
    .insert({
      sharing_link_id: sharingLinkId,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      action
    });

  if (error) throw error;
}

// =====================================================
// SOCIAL REALTIME - SOSYAL CANLI GÜNCELLEMELER
// =====================================================

export async function logSocialEvent(
  userId: string,
  eventType: string,
  targetEntityType: string,
  targetEntityId: string,
  actorId: string,
  eventData?: any
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('log_social_event', {
      p_user_id: userId,
      p_event_type: eventType,
      p_target_entity_type: targetEntityType,
      p_target_entity_id: targetEntityId,
      p_actor_id: actorId,
      p_event_data: eventData || {}
    });

  if (error) throw error;
  return data;
}

export function subscribeToSocialEvents(
  userId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = createClient();

  socialEventsChannel = supabase
    .channel(`social_events:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'social_realtime_events',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    if (socialEventsChannel) {
      socialEventsChannel.unsubscribe();
      socialEventsChannel = null;
    }
  };
}

// =====================================================
// MESSAGE DELIVERY - MESAJ GÖNDERIMI
// =====================================================

export async function updateMessageDelivery(
  messageId: string,
  recipientUserId: string,
  status: 'sent' | 'delivered' | 'read',
  deliveredOnDeviceId?: string,
  deliveredOnTabIds?: string[]
) {
  const supabase = createClient();

  const { error } = await supabase
    .rpc('update_message_delivery', {
      p_message_id: messageId,
      p_recipient_user_id: recipientUserId,
      p_status: status,
      p_delivered_on_device_id: deliveredOnDeviceId,
      p_delivered_on_tab_ids: deliveredOnTabIds
    });

  if (error) throw error;
}

export function subscribeToMessageDelivery(
  userId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = createClient();

  messageDeliveryChannel = supabase
    .channel(`message_delivery:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_delivery_status',
        filter: `recipient_user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    if (messageDeliveryChannel) {
      messageDeliveryChannel.unsubscribe();
      messageDeliveryChannel = null;
    }
  };
}

// =====================================================
// GET SHARED ITEMS - PAYLAŞILAN ÖĞELERI AL
// =====================================================

export async function getSharedItems(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('shared_items')
    .select(`
      *,
      sharing_permissions (*),
      sharing_links (*)
    `)
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSharingPermissions(sharedItemId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sharing_permissions')
    .select('*')
    .eq('shared_item_id', sharedItemId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

export async function getSharingLinks(sharedItemId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sharing_links')
    .select('*')
    .eq('shared_item_id', sharedItemId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}
/**
 * Comments & Analyses Sync
 */
export async function saveComment(itemId: string, comment: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('item_comments')
    .insert({
      item_id: itemId,
      user_id: user.id,
      user_name: comment.userName,
      content: comment.content,
      created_at: comment.createdAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveAnalysis(itemId: string, analysis: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('item_analyses')
    .insert({
      item_id: itemId,
      user_id: user.id,
      user_name: analysis.userName,
      type: analysis.type,
      title: analysis.title,
      content: analysis.content,
      created_at: analysis.createdAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function loadComments(itemId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('item_comments')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function loadAnalyses(itemId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('item_analyses')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function subscribeFolderComments(folderId: string, callback: (comments: any[]) => void) {
  const supabase = createClient();

  const channel = supabase
    .channel(`folder_comments:${folderId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'item_comments', filter: `item_id=eq.${folderId}` },
      async () => {
        const comments = await loadComments(folderId);
        callback(comments);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function saveLike(itemId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already liked
  const { data: existing } = await supabase
    .from('item_likes')
    .select('id')
    .eq('item_id', itemId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('item_likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false; // unliked
  } else {
    // Like
    const { error } = await supabase
      .from('item_likes')
      .insert({
        item_id: itemId,
        user_id: user.id,
        created_at: new Date().toISOString(),
      });
    if (error) throw error;
    return true; // liked
  }
}

export async function getLikesCount(itemId: string) {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('item_likes')
    .select('*', { count: 'exact', head: true })
    .eq('item_id', itemId);

  if (error) throw error;
  return count || 0;
}

// Comment Management Functions
export async function updateComment(commentId: string, content: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('item_comments')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('item_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) throw error;
  return true;
}
