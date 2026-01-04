/**
 * Supabase Real-time Sync
 * Syncs user canvas data across devices and browsers in real-time
 */

import { createClient } from '@/lib/supabase/client';
import { Tab, NewTabBehavior, StartupBehavior } from './store';
import { RealtimeChannel } from '@supabase/supabase-js';
import { GridModeState } from './layout-engine';

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
      console.error('Failed to save canvas data:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving canvas data:', error);
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
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_canvas_data')
      .select('*')
      .eq('user_id', userId)
      .eq('data_type', dataType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return null
        return null;
      }
      console.error('Failed to load canvas data:', error);
      return null;
    }

    return data?.data || null;
  } catch (error) {
    console.error('Error loading canvas data:', error);
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
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_canvas_data')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to load all canvas data:', error);
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
      console.error('Failed to save user preferences:', error);
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
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to load user preferences:', error);
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
    await saveUserPreferences(userId, {
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

    // Mark migration as done
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
