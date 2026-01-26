'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { ContentItem } from '@/lib/initial-content';

export interface CanvasUser {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  cursor?: { x: number; y: number };
  selected_items?: string[];
  current_view?: string;
  last_active: string;
  color: string;
}

export interface CanvasSyncState {
  users: CanvasUser[];
  isConnected: boolean;
  lastSync: Date | null;
  pendingChanges: number;
}

// Random color generator for user cursors
function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Hook for multi-user canvas synchronization with real-time presence
 */
export function useCanvasSync(canvasId: string, userId?: string, userName?: string) {
  const [state, setState] = useState<CanvasSyncState>({
    users: [],
    isConnected: false,
    lastSync: null,
    pendingChanges: 0,
  });
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userColor = useRef<string>(getRandomColor());
  const supabase = createClient();

  // Initialize presence channel
  useEffect(() => {
    if (!canvasId || !userId) return;

    const channel = supabase.channel(`canvas_${canvasId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const users = formatPresenceState(presenceState);
      setState(prev => ({ ...prev, users, isConnected: true }));
    });

    // Handle user join
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('👋 User joined canvas:', key, newPresences);
    });

    // Handle user leave
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('👋 User left canvas:', key, leftPresences);
    });

    // Handle broadcast events (item changes, selections, etc.)
    channel.on('broadcast', { event: 'item_update' }, ({ payload }) => {
      console.log('📦 Item updated by another user:', payload);
      // Emit custom event for canvas to handle
      window.dispatchEvent(new CustomEvent('canvas_item_update', { detail: payload }));
    });

    channel.on('broadcast', { event: 'item_create' }, ({ payload }) => {
      console.log('➕ Item created by another user:', payload);
      window.dispatchEvent(new CustomEvent('canvas_item_create', { detail: payload }));
    });

    channel.on('broadcast', { event: 'item_delete' }, ({ payload }) => {
      console.log('🗑️ Item deleted by another user:', payload);
      window.dispatchEvent(new CustomEvent('canvas_item_delete', { detail: payload }));
    });

    channel.on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
      // Update cursor position for other users
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => 
          u.user_id === payload.user_id 
            ? { ...u, cursor: payload.cursor }
            : u
        ),
      }));
    });

    channel.on('broadcast', { event: 'selection_change' }, ({ payload }) => {
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => 
          u.user_id === payload.user_id 
            ? { ...u, selected_items: payload.selected_items }
            : u
        ),
      }));
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          user_name: userName || 'Anonim',
          color: userColor.current,
          last_active: new Date().toISOString(),
        });
        setState(prev => ({ ...prev, isConnected: true }));
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setState(prev => ({ ...prev, isConnected: false }));
    };
  }, [canvasId, userId, userName, supabase]);

  // Format presence state to user list
  function formatPresenceState(presenceState: RealtimePresenceState): CanvasUser[] {
    const users: CanvasUser[] = [];
    
    for (const [, presences] of Object.entries(presenceState)) {
      for (const presence of presences as any[]) {
        if (presence.user_id !== userId) { // Don't include current user
          users.push({
            user_id: presence.user_id,
            user_name: presence.user_name,
            user_avatar: presence.user_avatar,
            cursor: presence.cursor,
            selected_items: presence.selected_items,
            current_view: presence.current_view,
            last_active: presence.last_active,
            color: presence.color || getRandomColor(),
          });
        }
      }
    }
    
    return users;
  }

  // Broadcast cursor position
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !userId) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor_move',
      payload: { user_id: userId, cursor: { x, y } },
    });
  }, [userId]);

  // Broadcast item selection
  const broadcastSelection = useCallback((selectedIds: string[]) => {
    if (!channelRef.current || !userId) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'selection_change',
      payload: { user_id: userId, selected_items: selectedIds },
    });
  }, [userId]);

  // Broadcast item update
  const broadcastItemUpdate = useCallback((item: ContentItem) => {
    if (!channelRef.current || !userId) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'item_update',
      payload: { user_id: userId, item },
    });
  }, [userId]);

  // Broadcast item creation
  const broadcastItemCreate = useCallback((item: ContentItem) => {
    if (!channelRef.current || !userId) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'item_create',
      payload: { user_id: userId, item },
    });
  }, [userId]);

  // Broadcast item deletion
  const broadcastItemDelete = useCallback((itemId: string) => {
    if (!channelRef.current || !userId) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'item_delete',
      payload: { user_id: userId, item_id: itemId },
    });
  }, [userId]);

  // Sync item to cloud database
  const syncItemToCloud = useCallback(async (item: ContentItem) => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));
      
      const { error } = await supabase
        .from('canvas_items')
        .upsert({
          id: item.id,
          user_id: userId,
          canvas_id: canvasId,
          item_data: item,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) {
        console.error('Failed to sync item to cloud:', error);
      } else {
        setState(prev => ({ 
          ...prev, 
          lastSync: new Date(),
          pendingChanges: Math.max(0, prev.pendingChanges - 1),
        }));
      }
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
  }, [userId, canvasId, supabase]);

  // Load items from cloud
  const loadFromCloud = useCallback(async (): Promise<ContentItem[]> => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('canvas_items')
        .select('item_data')
        .eq('canvas_id', canvasId)
        .eq('user_id', userId);

      if (error) {
        console.warn('Failed to load from cloud:', error.message);
        return [];
      }

      return data?.map(row => row.item_data as ContentItem) || [];
    } catch (err) {
      console.error('Cloud load error:', err);
      return [];
    }
  }, [userId, canvasId, supabase]);

  // Delete item from cloud
  const deleteFromCloud = useCallback(async (itemId: string) => {
    if (!userId) return;

    try {
      await supabase
        .from('canvas_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);
    } catch (err) {
      console.error('Cloud delete error:', err);
    }
  }, [userId, supabase]);

  return {
    ...state,
    broadcastCursor,
    broadcastSelection,
    broadcastItemUpdate,
    broadcastItemCreate,
    broadcastItemDelete,
    syncItemToCloud,
    loadFromCloud,
    deleteFromCloud,
    userColor: userColor.current,
  };
}

/**
 * Hook for displaying other users' cursors on canvas
 */
export function useRemoteCursors(users: CanvasUser[]) {
  return users.filter(u => u.cursor).map(u => ({
    userId: u.user_id,
    userName: u.user_name,
    x: u.cursor!.x,
    y: u.cursor!.y,
    color: u.color,
  }));
}

/**
 * Component for rendering a remote user's cursor
 */
export function RemoteCursor({ 
  userName, 
  x, 
  y, 
  color 
}: { 
  userName: string; 
  x: number; 
  y: number; 
  color: string;
}) {
  return (
    <div
      className="pointer-events-none fixed z-50 transition-transform duration-75"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M4 0L20 12L11 13L8 20L4 0Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* User name tag */}
      <div
        className="ml-2 mt-1 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </div>
  );
}

/**
 * Hook for throttled cursor broadcast
 */
export function useThrottledCursor(
  broadcastCursor: (x: number, y: number) => void,
  throttleMs: number = 50
) {
  const lastBroadcast = useRef<number>(0);

  const throttledBroadcast = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastBroadcast.current >= throttleMs) {
      broadcastCursor(x, y);
      lastBroadcast.current = now;
    }
  }, [broadcastCursor, throttleMs]);

  return throttledBroadcast;
}
