/**
 * Realtime Connection Manager
 * 
 * Centralized management for all Supabase Realtime subscriptions.
 * Handles connection lifecycle, reconnection, and cleanup.
 */

import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { syncLogger } from './logger';

export type ChannelName = 
  | 'canvas-changes'
  | 'search-history'
  | 'ai-chat'
  | 'toolkit-changes'
  | 'trash-changes'
  | 'scene-changes'
  | 'presentation-changes'
  | 'multi-tab-sync'
  | 'social-events'
  | 'message-delivery';

export interface ChannelConfig {
  name: ChannelName;
  userId?: string;
  additionalId?: string; // For presentation, scene, etc.
  onUpdate: (payload: any) => void;
  onError?: (error: Error) => void;
}

class RealtimeConnectionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  /**
   * Subscribe to a realtime channel
   */
  subscribe(
    supabase: SupabaseClient,
    config: ChannelConfig
  ): () => void {
    const channelKey = this.getChannelKey(config);

    // Unsubscribe existing channel if present
    if (this.channels.has(channelKey)) {
      syncLogger.debug(`Channel ${channelKey} already exists, unsubscribing old`);
      this.unsubscribe(channelKey);
    }

    const channelName = this.buildChannelName(config);
    syncLogger.info(`Subscribing to channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.getTableName(config.name),
        },
        (payload) => {
          syncLogger.debug(`Received ${payload.eventType} on ${channelName}`, {
            eventType: payload.eventType,
            table: payload.table,
          });
          
          try {
            config.onUpdate(payload);
          } catch (error) {
            syncLogger.error(`Error handling payload for ${channelName}`, error);
            config.onError?.(error as Error);
          }
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          syncLogger.info(`Successfully subscribed to ${channelName}`);
          this.reconnectAttempts.set(channelKey, 0);
        } else if (status === 'CHANNEL_ERROR') {
          syncLogger.error(`Channel error for ${channelName}`, error);
          this.handleReconnect(supabase, config, channelKey);
        } else if (status === 'TIMED_OUT') {
          syncLogger.warn(`Subscription timeout for ${channelName}`);
          this.handleReconnect(supabase, config, channelKey);
        } else if (status === 'CLOSED') {
          syncLogger.info(`Channel closed: ${channelName}`);
        }
      });

    this.channels.set(channelKey, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(channelKey);
  }

  /**
   * Unsubscribe from a channel
   */
  private unsubscribe(channelKey: string) {
    const channel = this.channels.get(channelKey);
    if (channel) {
      syncLogger.info(`Unsubscribing from channel: ${channelKey}`);
      channel.unsubscribe();
      this.channels.delete(channelKey);
      this.reconnectAttempts.delete(channelKey);
    }
  }

  /**
   * Unsubscribe all channels
   */
  unsubscribeAll() {
    syncLogger.info(`Unsubscribing from ${this.channels.size} channels`);
    this.channels.forEach((_, key) => this.unsubscribe(key));
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(
    supabase: SupabaseClient,
    config: ChannelConfig,
    channelKey: string
  ) {
    const attempts = this.reconnectAttempts.get(channelKey) ?? 0;

    if (attempts >= this.maxReconnectAttempts) {
      syncLogger.error(`Max reconnect attempts reached for ${channelKey}`);
      config.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts);
    syncLogger.warn(`Reconnecting ${channelKey} in ${delay}ms (attempt ${attempts + 1})`);

    this.reconnectAttempts.set(channelKey, attempts + 1);

    setTimeout(() => {
      this.unsubscribe(channelKey);
      this.subscribe(supabase, config);
    }, delay);
  }

  /**
   * Build unique channel key for tracking
   */
  private getChannelKey(config: ChannelConfig): string {
    const parts: string[] = [config.name];
    if (config.userId) parts.push(config.userId);
    if (config.additionalId) parts.push(config.additionalId);
    return parts.join(':');
  }

  /**
   * Build channel name for Supabase
   */
  private buildChannelName(config: ChannelConfig): string {
    const parts: string[] = [config.name];
    if (config.userId) parts.push(config.userId);
    if (config.additionalId) parts.push(config.additionalId);
    return parts.join(':');
  }

  /**
   * Map channel name to table name
   */
  private getTableName(channelName: ChannelName): string {
    const mapping: Record<ChannelName, string> = {
      'canvas-changes': 'canvas_data',
      'search-history': 'search_history',
      'ai-chat': 'ai_conversations',
      'toolkit-changes': 'user_toolkit',
      'trash-changes': 'trash_bucket',
      'scene-changes': 'scenes',
      'presentation-changes': 'presentations',
      'multi-tab-sync': 'multi_tab_sync',
      'social-events': 'social_events',
      'message-delivery': 'message_delivery',
    };
    return mapping[channelName] || 'canvas_data';
  }

  /**
   * Get connection status
   */
  getStatus(): {
    activeChannels: number;
    channels: string[];
  } {
    return {
      activeChannels: this.channels.size,
      channels: Array.from(this.channels.keys()),
    };
  }
}

// Singleton instance
export const realtimeManager = new RealtimeConnectionManager();
