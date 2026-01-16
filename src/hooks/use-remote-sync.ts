'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface RemoteSession {
  id: string;
  user_id: string | null;
  session_code: string;
  device_name: string | null;
  device_type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  browser_info: Record<string, any>;
  is_host: boolean;
  host_session_id: string | null;
  is_active: boolean;
  last_ping_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface RemoteCommand {
  id: string;
  session_id: string;
  from_device_id: string | null;
  command_type: RemoteCommandType;
  payload: Record<string, any>;
  target_player_id: string | null;
  status: 'pending' | 'executed' | 'failed' | 'expired';
  executed_at: string | null;
  created_at: string;
}

export type RemoteCommandType = 
  | 'play' | 'pause' | 'play_pause' | 'stop'
  | 'volume' | 'mute' | 'unmute'
  | 'seek' | 'quality'
  | 'next' | 'prev'
  | 'loop' | 'fullscreen'
  | 'layout_change' | 'grid_columns'
  | 'content_add' | 'content_remove' | 'content_reorder'
  | 'navigate' | 'tab_change'
  | 'ui_toggle' | 'sidebar_toggle'
  | 'ping' | 'pong'
  | 'sync_state' | 'request_state';

export interface RemotePlayerState {
  id: string;
  session_id: string;
  player_id: string;
  player_type: string;
  title: string | null;
  source_url: string | null;
  is_playing: boolean;
  is_muted: boolean;
  volume: number;
  current_time: number;
  duration: number;
  quality: string | null;
  loop_enabled: boolean;
  playback_rate: number;
  position: { x?: number; y?: number; width?: number; height?: number };
  metadata: Record<string, any>;
  updated_at: string;
}

export interface RemoteCanvasState {
  id: string;
  session_id: string;
  active_tab_id: string | null;
  active_view_id: string | null;
  layout_mode: 'grid' | 'canvas';
  grid_columns: number;
  zoom_level: number;
  scroll_position: { x: number; y: number };
  selected_items: string[];
  visible_items: string[];
  ui_settings: Record<string, any>;
  updated_at: string;
}

interface UseRemoteSyncOptions {
  onCommand?: (command: RemoteCommand) => void;
  onPlayerStateChange?: (state: RemotePlayerState) => void;
  onCanvasStateChange?: (state: RemoteCanvasState) => void;
  onDeviceConnected?: (session: RemoteSession) => void;
  onDeviceDisconnected?: (sessionId: string) => void;
  autoSync?: boolean;
}

// Device info helper
function getDeviceInfo(): { type: 'mobile' | 'desktop' | 'tablet'; name: string; browser: Record<string, any> } {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  
  let name = 'Unknown Device';
  let browserName = 'Unknown';
  
  if (typeof navigator !== 'undefined') {
    if (/Chrome/i.test(ua)) browserName = 'Chrome';
    else if (/Firefox/i.test(ua)) browserName = 'Firefox';
    else if (/Safari/i.test(ua)) browserName = 'Safari';
    else if (/Edge/i.test(ua)) browserName = 'Edge';
    
    const platform = navigator.platform || '';
    if (isMobile) {
      name = /iPhone/i.test(ua) ? 'iPhone' : /Android/i.test(ua) ? 'Android' : 'Mobile Device';
    } else if (isTablet) {
      name = /iPad/i.test(ua) ? 'iPad' : 'Tablet';
    } else {
      name = platform.includes('Win') ? 'Windows PC' : platform.includes('Mac') ? 'Mac' : 'Desktop';
    }
  }
  
  return {
    type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    name: `${name} (${browserName})`,
    browser: {
      userAgent: ua,
      language: typeof navigator !== 'undefined' ? navigator.language : 'en',
      platform: typeof navigator !== 'undefined' ? navigator.platform : '',
    }
  };
}

export function useRemoteSync(options: UseRemoteSyncOptions = {}) {
  const { onCommand, onPlayerStateChange, onCanvasStateChange, onDeviceConnected, onDeviceDisconnected, autoSync = true } = options;
  
  const [session, setSession] = useState<RemoteSession | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<RemoteSession[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerStates, setPlayerStates] = useState<RemotePlayerState[]>([]);
  const [canvasState, setCanvasState] = useState<RemoteCanvasState | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();
  
  const { user, activeTabId, layoutMode, gridModeState, isSecondLeftSidebarOpen, isUiHidden } = useAppStore();
  
  // Create a new host session
  const createSession = useCallback(async (): Promise<RemoteSession | null> => {
    if (!user) {
      setError('Oturum oluşturmak için giriş yapmalısınız');
      return null;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const deviceInfo = getDeviceInfo();
      
      const { data, error: insertError } = await supabase
        .from('remote_sync_sessions')
        .insert({
          user_id: user.id,
          device_name: deviceInfo.name,
          device_type: deviceInfo.type,
          browser_info: deviceInfo.browser,
          is_host: true,
          is_active: true,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      setSession(data as RemoteSession);
      return data as RemoteSession;
    } catch (err: any) {
      setError(err.message || 'Oturum oluşturulamadı');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [user, supabase]);
  
  // Join an existing session by code
  const joinSession = useCallback(async (code: string): Promise<RemoteSession | null> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Find host session by code
      const { data: hostSession, error: findError } = await supabase
        .from('remote_sync_sessions')
        .select()
        .eq('session_code', code.toUpperCase())
        .eq('is_active', true)
        .eq('is_host', true)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (findError || !hostSession) {
        throw new Error('Geçersiz veya süresi dolmuş oturum kodu');
      }
      
      const deviceInfo = getDeviceInfo();
      
      // Create client session linked to host
      const { data, error: insertError } = await supabase
        .from('remote_sync_sessions')
        .insert({
          user_id: user?.id || null,
          device_name: deviceInfo.name,
          device_type: deviceInfo.type,
          browser_info: deviceInfo.browser,
          is_host: false,
          host_session_id: hostSession.id,
          is_active: true,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      setSession(data as RemoteSession);
      return data as RemoteSession;
    } catch (err: any) {
      setError(err.message || 'Oturuma katılınamadı');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [user, supabase]);
  
  // Send a command to the session
  const sendCommand = useCallback(async (
    commandType: RemoteCommandType,
    payload: Record<string, any> = {},
    targetPlayerId?: string
  ): Promise<boolean> => {
    if (!session) {
      setError('Aktif oturum yok');
      return false;
    }
    
    const targetSessionId = session.is_host ? session.id : session.host_session_id;
    if (!targetSessionId) {
      setError('Hedef oturum bulunamadı');
      return false;
    }
    
    try {
      const { error: insertError } = await supabase
        .from('remote_commands')
        .insert({
          session_id: targetSessionId,
          from_device_id: session.id,
          command_type: commandType,
          payload,
          target_player_id: targetPlayerId,
          status: 'pending',
        });
      
      if (insertError) throw insertError;
      return true;
    } catch (err: any) {
      console.error('Command send error:', err);
      return false;
    }
  }, [session, supabase]);
  
  // Update player state
  const updatePlayerState = useCallback(async (state: Partial<RemotePlayerState> & { player_id: string }): Promise<boolean> => {
    if (!session) return false;
    
    const targetSessionId = session.is_host ? session.id : session.host_session_id;
    if (!targetSessionId) return false;
    
    try {
      const { error: upsertError } = await supabase
        .from('remote_player_states')
        .upsert({
          session_id: targetSessionId,
          ...state,
        }, {
          onConflict: 'session_id,player_id'
        });
      
      if (upsertError) throw upsertError;
      return true;
    } catch (err: any) {
      console.error('Player state update error:', err);
      return false;
    }
  }, [session, supabase]);
  
  // Update canvas state
  const updateCanvasState = useCallback(async (state: Partial<RemoteCanvasState>): Promise<boolean> => {
    if (!session) return false;
    
    const targetSessionId = session.is_host ? session.id : session.host_session_id;
    if (!targetSessionId) return false;
    
    try {
      const { error: upsertError } = await supabase
        .from('remote_canvas_states')
        .upsert({
          session_id: targetSessionId,
          ...state,
        }, {
          onConflict: 'session_id'
        });
      
      if (upsertError) throw upsertError;
      return true;
    } catch (err: any) {
      console.error('Canvas state update error:', err);
      return false;
    }
  }, [session, supabase]);
  
  // Mark command as executed
  const markCommandExecuted = useCallback(async (commandId: string, success: boolean = true): Promise<void> => {
    await supabase
      .from('remote_commands')
      .update({
        status: success ? 'executed' : 'failed',
        executed_at: new Date().toISOString(),
      })
      .eq('id', commandId);
  }, [supabase]);
  
  // Disconnect from session
  const disconnect = useCallback(async (): Promise<void> => {
    if (session) {
      await supabase
        .from('remote_sync_sessions')
        .update({ is_active: false })
        .eq('id', session.id);
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    setSession(null);
    setConnectedDevices([]);
    setPlayerStates([]);
    setCanvasState(null);
  }, [session, supabase]);
  
  // Subscribe to realtime updates
  useEffect(() => {
    if (!session) return;
    
    const targetSessionId = session.is_host ? session.id : session.host_session_id;
    if (!targetSessionId) return;
    
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    // Create channel for this session
    const channel = supabase.channel(`remote-sync-${targetSessionId}`)
      // Listen for new commands
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'remote_commands',
          filter: `session_id=eq.${targetSessionId}`,
        },
        (payload) => {
          const command = payload.new as RemoteCommand;
          // Don't process our own commands
          if (command.from_device_id !== session.id) {
            onCommand?.(command);
          }
        }
      )
      // Listen for player state changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'remote_player_states',
          filter: `session_id=eq.${targetSessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setPlayerStates(prev => prev.filter(p => p.id !== (payload.old as any).id));
          } else {
            const state = payload.new as RemotePlayerState;
            setPlayerStates(prev => {
              const idx = prev.findIndex(p => p.player_id === state.player_id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = state;
                return updated;
              }
              return [...prev, state];
            });
            onPlayerStateChange?.(state);
          }
        }
      )
      // Listen for canvas state changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'remote_canvas_states',
          filter: `session_id=eq.${targetSessionId}`,
        },
        (payload) => {
          if (payload.eventType !== 'DELETE') {
            const state = payload.new as RemoteCanvasState;
            setCanvasState(state);
            onCanvasStateChange?.(state);
          }
        }
      )
      // Listen for device connections (only for host)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'remote_sync_sessions',
          filter: session.is_host ? `host_session_id=eq.${session.id}` : `id=eq.${session.host_session_id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newDevice = payload.new as RemoteSession;
            setConnectedDevices(prev => [...prev, newDevice]);
            onDeviceConnected?.(newDevice);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as RemoteSession;
            if (!updated.is_active) {
              setConnectedDevices(prev => prev.filter(d => d.id !== updated.id));
              onDeviceDisconnected?.(updated.id);
            } else {
              setConnectedDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
            }
          } else if (payload.eventType === 'DELETE') {
            setConnectedDevices(prev => prev.filter(d => d.id !== (payload.old as any).id));
            onDeviceDisconnected?.((payload.old as any).id);
          }
        }
      )
      .subscribe();
    
    channelRef.current = channel;
    
    // Ping interval to keep session alive
    pingIntervalRef.current = setInterval(async () => {
      await supabase
        .from('remote_sync_sessions')
        .update({ last_ping_at: new Date().toISOString() })
        .eq('id', session.id);
    }, 30000); // Every 30 seconds
    
    // Load initial connected devices (for host)
    if (session.is_host) {
      supabase
        .from('remote_sync_sessions')
        .select()
        .eq('host_session_id', session.id)
        .eq('is_active', true)
        .then(({ data }) => {
          if (data) setConnectedDevices(data as RemoteSession[]);
        });
    }
    
    // Load initial player states
    supabase
      .from('remote_player_states')
      .select()
      .eq('session_id', targetSessionId)
      .then(({ data }) => {
        if (data) setPlayerStates(data as RemotePlayerState[]);
      });
    
    // Load initial canvas state
    supabase
      .from('remote_canvas_states')
      .select()
      .eq('session_id', targetSessionId)
      .single()
      .then(({ data }) => {
        if (data) setCanvasState(data as RemoteCanvasState);
      });
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [session, supabase, onCommand, onPlayerStateChange, onCanvasStateChange, onDeviceConnected, onDeviceDisconnected]);
  
  // Auto-sync canvas state when it changes (for host)
  useEffect(() => {
    if (!session?.is_host || !autoSync) return;
    
    const syncCanvasState = async () => {
      await updateCanvasState({
        active_tab_id: activeTabId,
        layout_mode: layoutMode,
        grid_columns: gridModeState.columns,
        ui_settings: {
          isSecondLeftSidebarOpen,
          isUiHidden,
        },
      });
    };
    
    // Debounce sync
    const timeout = setTimeout(syncCanvasState, 500);
    return () => clearTimeout(timeout);
  }, [session, autoSync, activeTabId, layoutMode, gridModeState.columns, isSecondLeftSidebarOpen, isUiHidden, updateCanvasState]);
  
  return {
    // Session state
    session,
    connectedDevices,
    isConnecting,
    error,
    isHost: session?.is_host ?? false,
    sessionCode: session?.session_code ?? null,
    
    // Player and canvas states
    playerStates,
    canvasState,
    
    // Actions
    createSession,
    joinSession,
    disconnect,
    sendCommand,
    updatePlayerState,
    updateCanvasState,
    markCommandExecuted,
    
    // Helpers
    isConnected: !!session?.is_active,
    deviceCount: connectedDevices.length + (session?.is_host ? 1 : 0),
  };
}

// Quick commands helper hook
export function useRemoteCommands() {
  const { sendCommand, isConnected } = useRemoteSync();
  
  return {
    isConnected,
    playAll: () => sendCommand('play'),
    pauseAll: () => sendCommand('pause'),
    playPause: (playerId?: string) => sendCommand('play_pause', {}, playerId),
    setVolume: (volume: number, playerId?: string) => sendCommand('volume', { volume }, playerId),
    mute: (playerId?: string) => sendCommand('mute', {}, playerId),
    unmute: (playerId?: string) => sendCommand('unmute', {}, playerId),
    seek: (time: number, playerId?: string) => sendCommand('seek', { time }, playerId),
    setQuality: (quality: string, playerId?: string) => sendCommand('quality', { quality }, playerId),
    next: () => sendCommand('next'),
    prev: () => sendCommand('prev'),
    toggleLoop: (enabled: boolean) => sendCommand('loop', { enabled }),
    toggleFullscreen: () => sendCommand('fullscreen'),
    setLayout: (mode: 'grid' | 'canvas') => sendCommand('layout_change', { mode }),
    setGridColumns: (columns: number) => sendCommand('grid_columns', { columns }),
    navigate: (tabId: string, viewId?: string) => sendCommand('navigate', { tabId, viewId }),
    toggleSidebar: () => sendCommand('sidebar_toggle'),
    toggleUI: () => sendCommand('ui_toggle'),
    requestState: () => sendCommand('request_state'),
  };
}
